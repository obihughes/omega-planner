'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useRecipes } from '@/hooks/useRecipes';
import { usePantry } from '@/hooks/usePantry';
import { useMeals } from '@/hooks/useMeals';
import { Recipe } from '@/types/recipes';

export const RecipesSidebar: React.FC<{ dateKey: string }> = ({ dateKey }) => {
  const { recipes, addRecipe, removeRecipe, getCookableRecipes, getRecipeSuggestions } = useRecipes();
  const { items: pantryItems } = usePantry();
  const { addMeal } = useMeals();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    description: '',
    ingredients: '',
    instructions: '',
    category: '',
    cookTime: '',
    servings: ''
  });

  const availableIngredients = useMemo(() => 
    new Set(pantryItems.map(item => item.name.toLowerCase())), 
    [pantryItems]
  );

  const cookableRecipes = useMemo(() => 
    getCookableRecipes(availableIngredients), 
    [getCookableRecipes, availableIngredients]
  );

  const suggestedRecipes = useMemo(() => 
    getRecipeSuggestions(availableIngredients, 0.6).slice(0, 5), 
    [getRecipeSuggestions, availableIngredients]
  );

  const handleAddRecipe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipe.name.trim()) return;

    const ingredients = newRecipe.ingredients
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const instructions = newRecipe.instructions
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    addRecipe(
      newRecipe.name,
      newRecipe.description || undefined,
      ingredients,
      instructions,
      newRecipe.cookTime ? parseInt(newRecipe.cookTime) : undefined,
      newRecipe.servings ? parseInt(newRecipe.servings) : undefined,
      newRecipe.category || undefined
    );

    setNewRecipe({
      name: '',
      description: '',
      ingredients: '',
      instructions: '',
      category: '',
      cookTime: '',
      servings: ''
    });
    setShowAddForm(false);
  };

  const addRecipeToMeal = (recipe: Recipe, slot: 'breakfast' | 'lunch' | 'dinner') => {
    addMeal(dateKey, slot, recipe.name, '', recipe.ingredients);
  };

  return (
    <Card className="border bg-card">
      <div className="px-3 py-2 border-b flex items-center justify-between">
        <div className="text-sm font-medium">Recipes</div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Recipe'}
        </Button>
      </div>
      <CardContent className="p-3 space-y-4 max-h-96 overflow-y-auto">
        {showAddForm && (
          <form onSubmit={handleAddRecipe} className="space-y-2 p-2 border rounded">
            <input
              value={newRecipe.name}
              onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Recipe name"
              className="w-full border px-2 py-1 bg-background text-sm"
              required
            />
            <input
              value={newRecipe.description}
              onChange={(e) => setNewRecipe(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Description (optional)"
              className="w-full border px-2 py-1 bg-background text-sm"
            />
            <textarea
              value={newRecipe.ingredients}
              onChange={(e) => setNewRecipe(prev => ({ ...prev, ingredients: e.target.value }))}
              placeholder="Ingredients (comma-separated)"
              className="w-full border px-2 py-1 bg-background text-sm h-16 resize-none"
              rows={2}
            />
            <div className="flex gap-2">
              <input
                value={newRecipe.category}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="flex-1 border px-2 py-1 bg-background text-sm"
              />
              <input
                value={newRecipe.cookTime}
                onChange={(e) => setNewRecipe(prev => ({ ...prev, cookTime: e.target.value }))}
                placeholder="Cook time (min)"
                type="number"
                className="w-20 border px-2 py-1 bg-background text-sm"
              />
            </div>
            <div className="flex gap-1">
              <Button type="submit" size="sm" className="flex-1">Add Recipe</Button>
            </div>
          </form>
        )}

        <div>
          <div className="text-xs text-muted-foreground mb-2">Can Make Now ({cookableRecipes.length})</div>
          <ul className="space-y-1">
            {cookableRecipes.length === 0 && (
              <li className="text-sm text-muted-foreground">Add pantry ingredients to see cookable recipes</li>
            )}
            {cookableRecipes.slice(0, 3).map(recipe => (
              <li key={recipe.id} className="text-sm group">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{recipe.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'breakfast')}
                      className="text-xs h-6"
                    >
                      B
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'lunch')}
                      className="text-xs h-6"
                    >
                      L
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'dinner')}
                      className="text-xs h-6"
                    >
                      D
                    </Button>
                  </div>
                </div>
                {recipe.description && (
                  <div className="text-xs text-muted-foreground mt-1">{recipe.description}</div>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">Suggested (60%+ match)</div>
          <ul className="space-y-1">
            {suggestedRecipes.length === 0 && (
              <li className="text-sm text-muted-foreground">No partial matches found</li>
            )}
            {suggestedRecipes.map(recipe => (
              <li key={recipe.id} className="text-sm group">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{recipe.name}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'breakfast')}
                      className="text-xs h-6"
                    >
                      B
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'lunch')}
                      className="text-xs h-6"
                    >
                      L
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => addRecipeToMeal(recipe, 'dinner')}
                      className="text-xs h-6"
                    >
                      D
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-xs text-muted-foreground mb-2">All Recipes ({recipes.length})</div>
          <ul className="space-y-1">
            {recipes.slice(0, 5).map(recipe => (
              <li key={recipe.id} className="text-sm group">
                <div className="flex items-center justify-between">
                  <span className="truncate pr-2">{recipe.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => removeRecipe(recipe.id)}
                    className="opacity-0 group-hover:opacity-100 text-xs h-6"
                  >
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecipesSidebar;
