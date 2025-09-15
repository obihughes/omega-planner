'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RecipeItem, RecipeIngredient } from '@/types/recipes';
import { X, ChefHat, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { usePantry } from '@/hooks/usePantry';

interface RecipeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe?: RecipeItem | null;
  onSave: (recipeData: Partial<RecipeItem>, isNew: boolean) => void;
  onDelete?: (recipeId: string) => void;
}

export function RecipeFormModal({ isOpen, onClose, recipe, onSave, onDelete }: RecipeFormModalProps) {
  const isNewRecipe = !recipe;
  const [name, setName] = useState('');
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([{ name: '' }]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const { items: pantryItems } = usePantry();

  useEffect(() => {
    if (recipe) {
      setName(recipe.name);
      setIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '' }]);
    } else {
      setName('');
      setIngredients([{ name: '' }]);
    }

    if (isOpen) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [recipe, isOpen]);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '' }]);
  };

  const removeIngredient = (index: number) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string) => {
    const updated = ingredients.map((ingredient, i) => 
      i === index ? { ...ingredient, [field]: value } : ingredient
    );
    setIngredients(updated);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    console.log('🧑‍🍳 RecipeFormModal: Save triggered with name:', trimmedName, 'ingredients:', ingredients);
    if (trimmedName === '') {
      console.log('🧑‍🍳 RecipeFormModal: Skipping save - no name');
      return;
    }

    const validIngredients = ingredients.filter(i => i.name.trim() !== '');
    console.log('🧑‍🍳 RecipeFormModal: Valid ingredients:', validIngredients);

    const recipeData: Partial<RecipeItem> = {
      name: trimmedName,
      ingredients: validIngredients,
    };

    console.log('🧑‍🍳 RecipeFormModal: Calling onSave with:', recipeData, 'isNew:', isNewRecipe);
    onSave(recipeData, isNewRecipe);
    onClose();
  };

  const handleDelete = () => {
    if (recipe && onDelete) {
        onDelete(recipe.id);
        onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            {isNewRecipe ? 'Create New Recipe' : 'Edit Recipe'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="recipe-name" className="block text-sm font-medium text-foreground mb-2">
              Recipe Name *
            </label>
            <Input
              id="recipe-name"
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter recipe name..."
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Ingredients
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Ingredient
              </Button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {ingredients.map((ingredient, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Ingredient name"
                      value={ingredient.name}
                      onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                      list={`pantry-suggestions-${index}`}
                    />
                    <Input
                      placeholder="Quantity (optional)"
                      value={ingredient.quantity || ''}
                      onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                    />
                    <datalist id={`pantry-suggestions-${index}`}>
                      {pantryItems.map(item => (
                        <option key={item.id} value={item.name} />
                      ))}
                    </datalist>
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
              {!isNewRecipe && onDelete && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleDelete}
                  className="text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete Recipe
                </Button>
              )}
            </div>
            <div className="flex space-x-3">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                disabled={name.trim() === '' || ingredients.every(i => i.name.trim() === '')}
              >
                {isNewRecipe ? 'Create Recipe' : 'Save Changes'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
