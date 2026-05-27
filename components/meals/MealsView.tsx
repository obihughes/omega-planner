'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMeals } from '@/hooks/useMeals';
import { MealFormModal } from '@/components/modals/MealFormModal';
import { MealItem } from '@/types/meals';
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatIngredient(ing: { name: string; quantity?: string }) {
  return ing.quantity ? `${ing.name} (${ing.quantity})` : ing.name;
}

function MealCard({
  meal,
  onEdit,
  onDelete,
}: {
  meal: MealItem;
  onEdit: (meal: MealItem) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article
      className={cn(
        'flex flex-col h-full min-h-[140px] rounded-lg border border-border bg-card',
        'hover:border-border/80 hover:shadow-sm transition-all'
      )}
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-2 border-b border-border/50">
        <button
          type="button"
          onClick={() => onEdit(meal)}
          className="text-left flex-1 min-w-0 group"
        >
          <h2 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {meal.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {meal.ingredients.length === 0
              ? 'No ingredients'
              : `${meal.ingredients.length} ingredient${meal.ingredients.length === 1 ? '' : 's'}`}
          </p>
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(meal.id)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
          aria-label={`Delete ${meal.name}`}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <button
        type="button"
        onClick={() => onEdit(meal)}
        className="flex-1 text-left p-4 pt-3 min-h-0 overflow-hidden"
      >
        {meal.ingredients.length > 0 ? (
          <ul className="space-y-1.5">
            {meal.ingredients.map((ing, i) => (
              <li
                key={`${meal.id}-${i}`}
                className="text-sm text-muted-foreground flex items-baseline gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0 mt-1.5" />
                <span className="line-clamp-2">{formatIngredient(ing)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">Click to add ingredients</p>
        )}
      </button>
    </article>
  );
}

export function MealsView() {
  const { meals, hydrated, add, update, remove } = useMeals();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMeal, setEditingMeal] = useState<MealItem | null>(null);

  const handleOpenNew = () => {
    setEditingMeal(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (meal: MealItem) => {
    setEditingMeal(meal);
    setIsModalOpen(true);
  };

  const handleSave = (
    data: { name: string; ingredients: MealItem['ingredients'] },
    isNew: boolean
  ) => {
    if (isNew) {
      add(data);
    } else if (editingMeal) {
      update(editingMeal.id, data);
    }
  };

  const handleDelete = (mealId: string) => {
    remove(mealId);
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0 px-4 sm:px-6 py-6">
      <header className="shrink-0 flex flex-wrap items-center justify-between gap-4 mb-6 max-w-[1600px] w-full mx-auto">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Meals</h1>
          {hydrated && (
            <p className="text-sm text-muted-foreground mt-1">
              {meals.length === 0
                ? 'Track what you cook and what you need'
                : `${meals.length} meal${meals.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={handleOpenNew}>
          <Plus className="w-4 h-4 mr-2" />
          Add meal
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto max-w-[1600px] w-full mx-auto">
        {!hydrated ? (
          <p className="text-sm text-muted-foreground py-12 text-center">Loading...</p>
        ) : meals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 rounded-lg border border-dashed border-border bg-muted/20">
            <UtensilsCrossed className="w-12 h-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">No meals yet</h2>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
              Add meals with their ingredients so you know what to buy and what to cook.
            </p>
            <Button variant="secondary" onClick={handleOpenNew}>
              <Plus className="w-4 h-4 mr-2" />
              Add your first meal
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 pb-4">
            {meals.map((meal) => (
              <MealCard
                key={meal.id}
                meal={meal}
                onEdit={handleOpenEdit}
                onDelete={remove}
              />
            ))}
          </div>
        )}
      </div>

      <MealFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        meal={editingMeal}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
