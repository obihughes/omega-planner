'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check, Search } from 'lucide-react';
import {
  appHierarchy,
  APP_MAP_LEGEND,
  type AppMapNode,
  type AppMapNodeKind,
} from '@/lib/appHierarchy';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const KIND_STYLES: Record<AppMapNodeKind, string> = {
  area: 'bg-primary/15 text-primary border-primary/30',
  shell: 'bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/30',
  route: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  page: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
  component: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  hook: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  context: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
  storage: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  modal: 'bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
};

function nodeMatchesQuery(node: AppMapNode, query: string): boolean {
  const q = query.toLowerCase();
  const fields = [node.label, node.path, node.description, node.editHint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return fields.includes(q);
}

function filterNodes(nodes: AppMapNode[], query: string): AppMapNode[] {
  if (!query.trim()) return nodes;

  const result: AppMapNode[] = [];
  for (const node of nodes) {
    const filteredChildren = node.children
      ? filterNodes(node.children, query)
      : undefined;
    const selfMatch = nodeMatchesQuery(node, query);
    const hasMatchingChildren = filteredChildren && filteredChildren.length > 0;

    if (selfMatch || hasMatchingChildren) {
      result.push({
        ...node,
        children: hasMatchingChildren ? filteredChildren : selfMatch ? node.children : undefined,
      });
    }
  }
  return result;
}

function collectAreaIds(nodes: AppMapNode[]): Set<string> {
  const ids = new Set<string>();
  for (const node of nodes) {
    if (node.kind === 'area') ids.add(node.id);
  }
  return ids;
}

type TreeNodeProps = {
  node: AppMapNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  copiedId: string | null;
  onCopy: (id: string, path: string) => void;
};

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
  copiedId,
  onCopy,
}: TreeNodeProps) {
  const hasChildren = Boolean(node.children?.length);
  const isExpanded = expanded.has(node.id);

  return (
    <div className="select-none">
      <div
        className={cn(
          'group flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors',
          depth > 0 && 'ml-4 border-l border-border/50 pl-3'
        )}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="mt-0.5 p-0.5 shrink-0 rounded hover:bg-secondary"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{node.label}</span>
            <span
              className={cn(
                'text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded border font-medium',
                KIND_STYLES[node.kind]
              )}
            >
              {node.kind}
            </span>
          </div>

          {node.path && (
            <div className="flex items-center gap-2 flex-wrap">
              <code className="text-xs font-mono text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {node.path}
              </code>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => onCopy(node.id, node.path!)}
              >
                {copiedId === node.id ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy path
                  </>
                )}
              </Button>
            </div>
          )}

          {node.description && (
            <p className="text-xs text-muted-foreground">{node.description}</p>
          )}
          {node.editHint && (
            <p className="text-xs text-primary/80 italic">{node.editHint}</p>
          )}
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
              copiedId={copiedId}
              onCopy={onCopy}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AppMapView() {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() =>
    collectAreaIds(appHierarchy)
  );

  const filteredTree = useMemo(
    () => filterNodes(appHierarchy, query),
    [query]
  );

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const all = new Set<string>();
    const walk = (nodes: AppMapNode[]) => {
      for (const n of nodes) {
        if (n.children?.length) {
          all.add(n.id);
          walk(n.children);
        }
      }
    };
    walk(filteredTree);
    setExpanded(all);
  }, [filteredTree]);

  const collapseAll = useCallback(() => {
    setExpanded(collectAreaIds(filteredTree));
  }, [filteredTree]);

  const handleCopy = useCallback(async (id: string, path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }, []);

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">App Map</h1>
          <p className="text-sm text-muted-foreground">
            Code hierarchy reference — routes, pages, components, hooks, and storage.
            Update <code className="text-xs bg-muted px-1 rounded">lib/appHierarchy.ts</code> when
            adding features.
          </p>
        </header>

        <div className="flex flex-wrap gap-2 text-[10px]">
          {APP_MAP_LEGEND.map(({ kind, label }) => (
            <span
              key={kind}
              className={cn(
                'px-1.5 py-0.5 rounded border uppercase tracking-wide font-medium',
                KIND_STYLES[kind]
              )}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search labels, paths, hints…"
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            <Button type="button" variant="outline" size="sm" onClick={expandAll}>
              Expand all
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={collapseAll}>
              Collapse
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-border/60 bg-card/50 p-2">
          {filteredTree.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No nodes match your search.
            </p>
          ) : (
            filteredTree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                expanded={expanded}
                onToggle={toggle}
                copiedId={copiedId}
                onCopy={handleCopy}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
