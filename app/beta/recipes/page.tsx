'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AppLayout } from '@/components/ui/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit2, Save, X, ChefHat, ShoppingCart, Star } from 'lucide-react';
import { RecipesStorage } from '@/utils/recipesStorage';
import { PantryStorage } from '@/utils/pantryStorage';
import { diffMissingNormalized, normalizeIngredientName } from '@/utils/ingredientUtils';
import { RecipeItem } from '@/types/recipes';
import { PantryItem } from '@/types/pantry';

export default function BetaRecipesPage() {
  const [activeTab, setActiveTab] = useState('recipes');
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [showRecipeForm, setShowRecipeForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem | null>(null);

  // Recipe form state
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [recipeIngredients, setRecipeIngredients] = useState<{ name: string; quantity: string }[]>([{ name: '', quantity: '' }]);
  const [recipeCookTime, setRecipeCookTime] = useState('');
  const [recipeServings, setRecipeServings] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('');

  // Pantry form state
  const [pantryName, setPantryName] = useState('');

  // Load data on mount
  useEffect(() => {
    setRecipes(RecipesStorage.load());
    setPantryItems(PantryStorage.load());
  }, []);

  // Recipe recommendations based on available ingredients
  const recipeRecommendations = useMemo(() => {
    const pantryNames = pantryItems.map(item => item.name);

    return recipes.map(recipe => {
      const requiredIngredients = recipe.ingredients.map(ing => ing.name);
      const missingIngredients = diffMissingNormalized(requiredIngredients, pantryNames);
      const matchPercentage = ((requiredIngredients.length - missingIngredients.length) / requiredIngredients.length) * 100;

      return {
        ...recipe,
        missingIngredients,
        matchPercentage,
        canMake: missingIngredients.length === 0
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }, [recipes, pantryItems]);

  // Save recipes to storage
  const saveRecipes = (newRecipes: RecipeItem[]) => {
    setRecipes(newRecipes);
    RecipesStorage.save(newRecipes);
  };

  // Save pantry items to storage
  const savePantryItems = (newItems: PantryItem[]) => {
    setPantryItems(newItems);
    PantryStorage.save(newItems);
  };

  // Recipe functions
  const resetRecipeForm = () => {
    setRecipeName('');
    setRecipeDescription('');
    setRecipeIngredients([{ name: '', quantity: '' }]);
    setRecipeCookTime('');
    setRecipeServings('');
    setRecipeCategory('');
    setEditingRecipe(null);
  };

  const handleSaveRecipe = () => {
    if (!recipeName.trim()) return;

    const ingredients = recipeIngredients.filter(ing => ing.name.trim());

    const recipe: RecipeItem = {
      id: editingRecipe?.id || `recipe_${Date.now()}`,
      name: recipeName.trim(),
      description: recipeDescription.trim() || undefined,
      ingredients,
      cookTimeMinutes: recipeCookTime ? parseInt(recipeCookTime) : undefined,
      servings: recipeServings ? parseInt(recipeServings) : undefined,
      category: recipeCategory.trim() || undefined,
      createdAt: editingRecipe?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newRecipes = editingRecipe
      ? recipes.map(r => r.id === editingRecipe.id ? recipe : r)
      : [...recipes, recipe];

    saveRecipes(newRecipes);
    resetRecipeForm();
    setShowRecipeForm(false);
  };

  const handleEditRecipe = (recipe: RecipeItem) => {
    setEditingRecipe(recipe);
    setRecipeName(recipe.name);
    setRecipeDescription(recipe.description || '');
    setRecipeIngredients(recipe.ingredients.length > 0 ? recipe.ingredients : [{ name: '', quantity: '' }]);
    setRecipeCookTime(recipe.cookTimeMinutes?.toString() || '');
    setRecipeServings(recipe.servings?.toString() || '');
    setRecipeCategory(recipe.category || '');
    setShowRecipeForm(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      saveRecipes(recipes.filter(r => r.id !== recipeId));
    }
  };

  const addRecipeIngredient = () => {
    setRecipeIngredients([...recipeIngredients, { name: '', quantity: '' }]);
  };

  const updateRecipeIngredient = (index: number, field: 'name' | 'quantity', value: string) => {
    const newIngredients = [...recipeIngredients];
    newIngredients[index][field] = value;
    setRecipeIngredients(newIngredients);
  };

  const removeRecipeIngredient = (index: number) => {
    if (recipeIngredients.length > 1) {
      setRecipeIngredients(recipeIngredients.filter((_, i) => i !== index));
    }
  };

  // Pantry functions
  const handleAddPantryItem = () => {
    if (!pantryName.trim()) return;

    const item: PantryItem = {
      id: `pantry_${Date.now()}`,
      name: pantryName.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savePantryItems([...pantryItems, item]);
    setPantryName('');
  };

  const handleDeletePantryItem = (itemId: string) => {
    savePantryItems(pantryItems.filter(i => i.id !== itemId));
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <header className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6" />
            <h1 className="text-xl font-medium">Recipes</h1>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3 mx-6 mt-4">
              <TabsTrigger value="recipes">Recipes</TabsTrigger>
              <TabsTrigger value="pantry">Pantry</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="recipes" className="px-6 py-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Recipes ({recipes.length})</h2>
                <Button onClick={() => setShowRecipeForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Recipe
                </Button>
              </div>

              {showRecipeForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingRecipe ? 'Edit Recipe' : 'Add New Recipe'}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Recipe Name *</label>
                      <Input
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                        placeholder="e.g., Spaghetti Carbonara"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <Textarea
                        value={recipeDescription}
                        onChange={(e) => setRecipeDescription(e.target.value)}
                        placeholder="Brief description or instructions..."
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Ingredients</label>
                      <div className="space-y-2">
                        {recipeIngredients.map((ing, index) => (
                          <div key={index} className="flex gap-2">
                            <Input
                              value={ing.name}
                              onChange={(e) => updateRecipeIngredient(index, 'name', e.target.value)}
                              placeholder="Ingredient name"
                              className="flex-1"
                            />
                            <Input
                              value={ing.quantity}
                              onChange={(e) => updateRecipeIngredient(index, 'quantity', e.target.value)}
                              placeholder="Quantity"
                              className="w-32"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeRecipeIngredient(index)}
                              disabled={recipeIngredients.length === 1}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="outline" onClick={addRecipeIngredient}>
                          <Plus className="w-4 h-4 mr-2" />
                          Add Ingredient
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Cook Time (min)</label>
                        <Input
                          type="number"
                          value={recipeCookTime}
                          onChange={(e) => setRecipeCookTime(e.target.value)}
                          placeholder="30"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Servings</label>
                        <Input
                          type="number"
                          value={recipeServings}
                          onChange={(e) => setRecipeServings(e.target.value)}
                          placeholder="4"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Category</label>
                        <Input
                          value={recipeCategory}
                          onChange={(e) => setRecipeCategory(e.target.value)}
                          placeholder="Italian, Dessert, etc."
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSaveRecipe}>
                        <Save className="w-4 h-4 mr-2" />
                        {editingRecipe ? 'Update' : 'Save'} Recipe
                      </Button>
                      <Button variant="outline" onClick={() => { setShowRecipeForm(false); resetRecipeForm(); }}>
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recipes.map((recipe) => (
                  <Card key={recipe.id}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          {recipe.category && (
                            <Badge variant="secondary" className="mt-1">{recipe.category}</Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditRecipe(recipe)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRecipe(recipe.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {recipe.description && (
                        <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                      )}
                      <div className="space-y-1 mb-3">
                        <p className="text-sm font-medium">Ingredients:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {recipe.ingredients.map((ing, idx) => (
                            <li key={idx} className="flex justify-between">
                              <span>{ing.name}</span>
                              {ing.quantity && <span className="text-xs">{ing.quantity}</span>}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        {recipe.cookTimeMinutes && <span>{recipe.cookTimeMinutes} min</span>}
                        {recipe.servings && <span>{recipe.servings} servings</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="pantry" className="px-6 py-4 space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Your Pantry ({pantryItems.length})</h2>
              </div>

              {/* Quick Add Input */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2">
                    <Input
                      value={pantryName}
                      onChange={(e) => setPantryName(e.target.value)}
                      placeholder="Add ingredient to pantry..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddPantryItem();
                        }
                      }}
                    />
                    <Button onClick={handleAddPantryItem} disabled={!pantryName.trim()}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Pantry Items List */}
              <div className="space-y-2">
                {pantryItems.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Add ingredients to your pantry to see recipe recommendations!</p>
                    </CardContent>
                  </Card>
                ) : (
                  pantryItems.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="py-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{item.name}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeletePantryItem(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="px-6 py-4 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Recipe Recommendations</h2>
              </div>

              {recipeRecommendations.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Add some recipes and pantry items to see recommendations!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {recipeRecommendations.map((recipe) => (
                    <Card key={recipe.id} className={recipe.canMake ? 'border-green-200 bg-green-50/50' : ''}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              {recipe.name}
                              {recipe.canMake && <Badge className="bg-green-500">Can Make!</Badge>}
                            </CardTitle>
                            {recipe.category && (
                              <Badge variant="secondary" className="mt-1">{recipe.category}</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {Math.round(recipe.matchPercentage)}% match
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {recipe.ingredients.length - recipe.missingIngredients.length}/{recipe.ingredients.length} ingredients
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {recipe.description && (
                          <p className="text-sm text-muted-foreground mb-3">{recipe.description}</p>
                        )}

                        {recipe.missingIngredients.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-orange-600 mb-2">Missing ingredients:</p>
                            <div className="flex flex-wrap gap-1">
                              {recipe.missingIngredients.map((ing, idx) => (
                                <Badge key={idx} variant="outline" className="text-orange-600 border-orange-300">
                                  {ing}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between text-xs text-muted-foreground">
                          {recipe.cookTimeMinutes && <span>{recipe.cookTimeMinutes} min</span>}
                          {recipe.servings && <span>{recipe.servings} servings</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}

