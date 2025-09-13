'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecipes } from '@/hooks/useRecipes';

export const RecipesSidebar: React.FC<{ dateKey: string }> = () => {
  const { recipes, addRecipe, removeRecipe, cookable, suggested, matchPercent } = useRecipes();
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const ings = ingredients.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ name: s }));
    if (!n || ings.length === 0) return;
    addRecipe({ name: n, ingredients: ings });
    setName('');
    setIngredients('');
  };

  return (
    <Card className="border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Recipes</div>
      </div>
      <CardContent className="p-3 space-y-4">
        <form className="space-y-2" onSubmit={handleAdd}>
          <input className="w-full border px-2 py-1 bg-background" placeholder="Recipe name" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="w-full border px-2 py-1 bg-background" placeholder="Ingredients (comma-separated)" value={ingredients} onChange={(e) => setIngredients(e.target.value)} />
          <Button type="submit" variant="ghost" size="sm">Add recipe</Button>
        </form>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Can make now</div>
          <ul className="space-y-1">
            {cookable.length === 0 && <li className="text-sm text-muted-foreground">None yet</li>}
            {cookable.map(r => (
              <li key={r.id} className="group flex items-center justify-between text-sm">
                <span className="truncate pr-2">{r.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeRecipe(r.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Suggested</div>
          <ul className="space-y-1">
            {suggested.length === 0 && <li className="text-sm text-muted-foreground">No suggestions yet</li>}
            {suggested.map(r => (
              <li key={r.id} className="group flex items-center justify-between text-sm">
                <span className="truncate pr-2">{r.name} <span className="text-xs text-muted-foreground">({matchPercent(r)}%)</span></span>
                <Button variant="ghost" size="sm" onClick={() => removeRecipe(r.id)}>Remove</Button>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipesSidebar;


