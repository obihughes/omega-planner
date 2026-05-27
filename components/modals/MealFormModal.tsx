'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MealItem, MealIngredient } from '@/types/meals';
import { Plus, Trash2, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';

interface MealFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  meal?: MealItem | null;
  onSave: (data: { name: string; ingredients: MealIngredient[] }, isNew: boolean) => void;
  onDelete?: (mealId: string) => void;
}

export function MealFormModal({ isOpen, onClose, meal, onSave, onDelete }: MealFormModalProps) {
  const isNew = !meal;
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<MealIngredient[]>([{ name: '' }]);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (meal) {
      setName(meal.name);
      setIngredients(meal.ingredients.length > 0 ? meal.ingredients : [{ name: '' }]);
    } else {
      setName('');
      setIngredients([{ name: '' }]);
    }
    if (isOpen) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [meal, isOpen]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof MealIngredient, value: string) => {
    setIngredients(
      ingredients.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const validIngredients = ingredients
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity?.trim() || undefined,
      }))
      .filter((i) => i.name.length > 0);

    onSave({ name: trimmedName, ingredients: validIngredients }, isNew);
    onClose();
  };

  const handleDelete = () => {
    if (meal && onDelete) {
      onDelete(meal.id);
      onClose();
    }
  };

  const canSave =
    name.trim() !== '' && ingredients.some((i) => i.name.trim() !== '');

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            {isNew ? 'Add meal' : 'Edit meal'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="meal-name" className="block text-sm font-medium text-foreground mb-2">
              Meal name *
            </label>
            <Input
              id="meal-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken stir fry"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">Ingredients</label>
              <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                <Plus className="w-4 h-4 mr-1" />
                Add ingredient
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Ingredient"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                    />
                    <Input
                      placeholder="Amount (optional)"
                      value={ingredient.quantity || ''}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    />
                  </div>
                  {ingredients.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIngredient(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center pt-4 border-t border-border">
            <div>
              {!isNew && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete meal
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={!canSave}>
                {isNew ? 'Add meal' : 'Save changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
