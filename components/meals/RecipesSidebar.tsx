'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRecipes } from '@/hooks/useRecipes';
import { useMeals } from '@/hooks/useMeals';
import { useShopping } from '@/hooks/useShopping';
import { RecipeFormModal } from '../modals/RecipeFormModal';
import { RecipeItem } from '@/types/recipes';
import { Plus, Trash2 } from 'lucide-react';
import { usePantry } from '@/hooks/usePantry';
import { normalizeIngredientName } from '@/utils/ingredientUtils';

export const RecipesSidebar: React.FC<{ dateKey: string }> = ({ dateKey }) => {
  const { recipes, addRecipe, removeRecipe, updateRecipe, cookable, suggestedTiered, matchPercent } = useRecipes();
  const { items: pantryItems } = usePantry();
  const { addMeal, updateMeal } = useMeals();
  const { add: addToShopping } = useShopping();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);

  const handleOpenNewRecipeModal = () => {
    setEditingRecipe(null);
    setIsModalOpen(true);
  };

  const handleOpenEditRecipeModal = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };

  const handleSaveRecipe = (recipeData: Partial<RecipeItem>, isNew: boolean) => {
    console.log('🧑‍🍳 RecipesSidebar: handleSaveRecipe called with:', { recipeData, isNew, editingRecipe });
    if (isNew) {
      console.log('🧑‍🍳 RecipesSidebar: Adding new recipe');
      const result = addRecipe(recipeData as Omit<RecipeItem, 'id' | 'createdAt' | 'updatedAt'>);
      console.log('🧑‍🍳 RecipesSidebar: addRecipe returned:', result);
    } else if (editingRecipe) {
      console.log('🧑‍🍳 RecipesSidebar: Updating existing recipe:', editingRecipe.id);
      updateRecipe(editingRecipe.id, recipeData);
    } else {
      console.log('🧑‍🍳 RecipesSidebar: Warning - not new but no editingRecipe');
    }
  };

  const pantrySet = new Set(pantryItems.map(i => normalizeIngredientName(i.name)));

  return (
    <>
      <Card className="border bg-card">
        <CardHeader className="px-3 py-2 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recipes</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleOpenNewRecipeModal}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-3 space-y-4">
          <div>
            <div className="text-xs text-muted-foreground mb-2">Can make now</div>
            <ul className="space-y-2">
              {cookable.length === 0 && <li className="text-sm text-muted-foreground">None yet</li>}
              {cookable.map(r => (
                <li key={r.id} className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="truncate pr-2 font-medium">{r.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const created = addMeal(dateKey, 'breakfast', r.name);
                          if (created) {
                            updateMeal(dateKey, 'breakfast', created.id, { ingredients: r.ingredients.map(i => i.name) });
                          }
                        }}
                      >
                        B
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const created = addMeal(dateKey, 'lunch', r.name);
                          if (created) {
                            updateMeal(dateKey, 'lunch', created.id, { ingredients: r.ingredients.map(i => i.name) });
                          }
                        }}
                      >
                        L
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const created = addMeal(dateKey, 'dinner', r.name);
                          if (created) {
                            updateMeal(dateKey, 'dinner', created.id, { ingredients: r.ingredients.map(i => i.name) });
                          }
                        }}
                      >
                        D
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.ingredients.map(i => i.name).join(', ')}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* High Match Suggestions (75%+) */}
          {suggestedTiered.high.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Almost Ready (75%+ match)
              </div>
              <ul className="space-y-2">
                {suggestedTiered.high.map(r => {
                  const missingIngredients = r.ingredients.filter(i => !pantrySet.has(normalizeIngredientName(i.name)));
                  const haveCount = r.ingredients.length - missingIngredients.length;
                  return (
                    <li key={r.id} className="text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">
                          {r.name} 
                          <span className="text-xs text-green-600 ml-1">
                            ({haveCount}/{r.ingredients.length})
                          </span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => missingIngredients.forEach(i => addToShopping(i.name))}
                          disabled={missingIngredients.length === 0}
                        >
                          Add missing
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {missingIngredients.length > 0
                          ? `Missing: ${missingIngredients.map(i => i.name).join(', ')}`
                          : 'You have all ingredients!'
                        }
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Medium Match Suggestions (50-74%) */}
          {suggestedTiered.medium.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                Good Match (50-74% match)
              </div>
              <ul className="space-y-2">
                {suggestedTiered.medium.map(r => {
                  const missingIngredients = r.ingredients.filter(i => !pantrySet.has(normalizeIngredientName(i.name)));
                  const haveCount = r.ingredients.length - missingIngredients.length;
                  return (
                    <li key={r.id} className="text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">
                          {r.name}
                          <span className="text-xs text-yellow-600 ml-1">
                            ({haveCount}/{r.ingredients.length})
                          </span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => missingIngredients.forEach(i => addToShopping(i.name))}
                        >
                          Add missing
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Missing: {missingIngredients.map(i => i.name).join(', ')}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Low Match Suggestions (25-49%) */}
          {suggestedTiered.low.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                Partial Match (25-49% match)
              </div>
              <ul className="space-y-2">
                {suggestedTiered.low.map(r => {
                  const missingIngredients = r.ingredients.filter(i => !pantrySet.has(normalizeIngredientName(i.name)));
                  const haveCount = r.ingredients.length - missingIngredients.length;
                  return (
                    <li key={r.id} className="text-sm space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate pr-2 font-medium">
                          {r.name}
                          <span className="text-xs text-orange-600 ml-1">
                            ({haveCount}/{r.ingredients.length})
                          </span>
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => missingIngredients.forEach(i => addToShopping(i.name))}
                        >
                          Add missing
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Missing: {missingIngredients.map(i => i.name).join(', ')}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* No suggestions message */}
          {suggestedTiered.high.length === 0 && suggestedTiered.medium.length === 0 && suggestedTiered.low.length === 0 && (
            <div>
              <div className="text-xs text-muted-foreground mb-2">Suggestions</div>
              <div className="text-sm text-muted-foreground">
                No recipe matches found. Add more ingredients to your pantry or create new recipes!
              </div>
            </div>
          )}

          <div>
            <div className="text-xs text-muted-foreground mb-2">All recipes</div>
            <ul className="space-y-1 max-h-32 overflow-y-auto">
              {recipes.map(r => {
                const canMake = cookable.includes(r);
                const percent = matchPercent(r);
                const missingCount = r.ingredients.filter(i => !pantrySet.has(normalizeIngredientName(i.name))).length;
                
                return (
                  <li key={r.id} className="group flex items-center justify-between text-sm hover:bg-accent rounded-md">
                    <div className="flex items-center gap-2 cursor-pointer flex-grow p-1" onClick={() => handleOpenEditRecipeModal(r)}>
                      {/* Match indicator */}
                      <div className="flex items-center gap-1">
                        {canMake ? (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Can make now"></span>
                        ) : percent >= 75 ? (
                          <span className="w-2 h-2 bg-green-400 rounded-full" title={`${percent}% match`}></span>
                        ) : percent >= 50 ? (
                          <span className="w-2 h-2 bg-yellow-500 rounded-full" title={`${percent}% match`}></span>
                        ) : percent >= 25 ? (
                          <span className="w-2 h-2 bg-orange-500 rounded-full" title={`${percent}% match`}></span>
                        ) : (
                          <span className="w-2 h-2 bg-gray-400 rounded-full" title={`${percent}% match`}></span>
                        )}
                      </div>
                      <span className="truncate">
                        {r.name}
                        {!canMake && missingCount > 0 && (
                          <span className="text-xs text-muted-foreground ml-1">
                            (-{missingCount})
                          </span>
                        )}
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100" onClick={() => removeRecipe(r.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          </div>
        </CardContent>
      </Card>
      <RecipeFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={editingRecipe}
        onSave={handleSaveRecipe}
        onDelete={removeRecipe}
      />
    </>
  );
};

export default RecipesSidebar;


