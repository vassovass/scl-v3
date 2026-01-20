"use client";

import { useState, useEffect } from "react";
import { DragDropContext } from "@hello-pangea/dnd";
import { toast } from "@/hooks/use-toast";
import { MenuList } from "@/components/admin/menus/MenuList";
import { MenuItemForm } from "@/components/admin/menus/MenuItemForm";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { menuCache } from "@/lib/cache/menuCache";
import {
  DroppableContainer,
  DraggableWrapper,
  DragHandle,
  DepthIndicator,
  LevelBadge,
  flattenTree,
} from "@/lib/dnd";

interface MenuItemData {
  id: string;
  item_key: string;
  label: string;
  href?: string | null;
  icon?: string | null;
  description?: string | null;
  visible_to?: string[] | null;
  hidden_from?: string[] | null;
  requires_league?: boolean;
  on_click?: string | null;
  external?: boolean;
  divider_before?: boolean;
  sort_order?: number;
  children?: MenuItemData[];
}

interface MenuDefinition {
  id: string;
  label?: string;
  description?: string;
  items: MenuItemData[];
}

interface MenuItemFormData {
  id?: string;
  item_key: string;
  label: string;
  href?: string | null;
  icon?: string | null;
  description?: string | null;
  visible_to?: string[] | null;
  hidden_from?: string[] | null;
  requires_league?: boolean;
  on_click?: string | null;
  external?: boolean;
  divider_before?: boolean;
}

export default function MenuEditorPage() {
  const [menus, setMenus] = useState<MenuDefinition[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState<string>('main');
  const [isLoading, setIsLoading] = useState(true);
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemFormData | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [parentItem, setParentItem] = useState<MenuItemData | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load menus on mount
  useEffect(() => {
    loadMenus();
  }, []);

  const loadMenus = async () => {
    try {
      const res = await fetch('/api/admin/menus');
      const data = await res.json();
      if (data.menus) {
        setMenus(data.menus);
      }
    } catch (error) {
      toast({
        title: 'Error loading menus',
        description: String(error),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedMenu = menus.find(m => m.id === selectedMenuId);

  const handleAddItem = () => {
    setEditingItem(null);
    setParentItem(null);
    setFormMode('create');
    setShowItemForm(true);
  };

  const handleAddChildItem = (parent: MenuItemData) => {
    setEditingItem(null);
    setParentItem(parent);
    setFormMode('create');
    setShowItemForm(true);
  };

  const handleEditItem = (item: MenuItemData) => {
    setEditingItem(item);
    setParentItem(null);
    setFormMode('edit');
    setShowItemForm(true);
  };

  const handleSaveItem = async (data: MenuItemFormData) => {
    try {
      if (formMode === 'create') {
        // Create new item
        const res = await fetch(`/api/admin/menus/${selectedMenuId}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data,
            parent_id: parentItem?.id || null,
          }),
        });

        if (!res.ok) throw new Error('Failed to create item');

        toast({
          title: 'Menu item created',
          description: `"${data.label}" has been added.`,
        });
      } else {
        // Update existing item
        const res = await fetch(`/api/admin/menus/${selectedMenuId}/items/${editingItem?.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!res.ok) throw new Error('Failed to update item');

        toast({
          title: 'Menu item updated',
          description: `"${data.label}" has been saved.`,
        });
      }

      // Invalidate menu cache for all users
      await menuCache.invalidate();
      console.log('[Menu Editor] Cache invalidated after menu item mutation');

      // Reload menus
      await loadMenus();
    } catch (error) {
      toast({
        title: 'Error saving item',
        description: String(error),
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/menus/${selectedMenuId}/items/${itemId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete item');

      // Invalidate menu cache for all users
      await menuCache.invalidate();
      console.log('[Menu Editor] Cache invalidated after menu item deletion');

      toast({
        title: 'Menu item deleted',
        description: 'The item has been removed.',
      });

      await loadMenus();
    } catch (error) {
      toast({
        title: 'Error deleting item',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  // Handle drag end - reorder items using shared utility
  const handleDragEnd = async (result: any) => {
    if (!result.destination || !selectedMenu) return;
    if (result.source.index === result.destination.index) return;

    // Get flat list of all items with their parent_id using shared utility
    const allItems = flattenTree(selectedMenu.items);

    // Reorder the items array
    const reordered = Array.from(allItems);
    const [movedItem] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, movedItem);

    // Update sort_order for all items
    const updates = reordered.map((item, index) => ({
      id: item.id,
      parent_id: item.parent_id,
      sort_order: index,
    }));

    try {
      // Send batch update to API
      const res = await fetch(`/api/admin/menus/${selectedMenuId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updates }),
      });

      if (!res.ok) throw new Error('Failed to reorder items');

      // Invalidate cache
      await menuCache.invalidate();

      toast({
        title: 'Items reordered',
        description: 'Menu order has been updated.',
      });

      // Reload menus
      await loadMenus();
    } catch (error) {
      toast({
        title: 'Error reordering items',
        description: String(error),
        variant: 'destructive',
      });
    }
  };

  const renderItem = (item: MenuItemData, index: number, depth: number = 0) => {
    const hasVisibilityRestrictions =
      (item.visible_to && item.visible_to.length > 0) ||
      item.requires_league;

    return (
      <DraggableWrapper key={item.id} draggableId={item.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={depth > 0 ? "ml-8" : ""}
          >
            <div
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg border transition-all mb-2 ${
                snapshot.isDragging
                  ? 'border-primary bg-primary/10 shadow-lg scale-105'
                  : 'border-border bg-card hover:bg-accent/50'
              }`}
            >
              {/* Drag handle - using shared component */}
              <DragHandle provided={provided} variant="dots" />

              {/* Depth indicator - using shared component */}
              <DepthIndicator depth={depth} />

              {/* Item info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {item.icon && <span className="text-base">{item.icon}</span>}
                  <span className="font-medium text-sm truncate text-foreground">{item.label}</span>
                  {hasVisibilityRestrictions && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-[hsl(var(--warning))]">
                      Restricted
                    </span>
                  )}
                  {/* Level badge - using shared component */}
                  <LevelBadge
                    level={depth}
                    className="text-xs px-1.5 py-0.5 rounded bg-[hsl(var(--info)/0.2)] text-[hsl(var(--info))]"
                  />
                </div>
                {(item.href || item.on_click) && (
                  <div className="text-xs text-muted-foreground truncate mt-0.5">
                    {item.href || `onClick: ${item.on_click}`}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEditItem(item)}
                  className="px-2 py-1 text-xs rounded bg-background border border-border hover:bg-accent text-foreground"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleAddChildItem(item)}
                  className="px-2 py-1 text-xs rounded bg-background border border-border hover:bg-accent text-foreground"
                >
                  Add Child
                </button>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="px-2 py-1 text-xs rounded bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 text-destructive"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Render children recursively */}
            {item.children && item.children.length > 0 && (
              <div className="mt-1">
                {item.children.map((child, childIndex) => renderItem(child, index + childIndex + 1, depth + 1))}
              </div>
            )}
          </div>
        )}
      </DraggableWrapper>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading menus...</div>
      </div>
    );
  }

  const rootItems = selectedMenu?.items || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Menu Editor</h1>
          <p className="text-muted-foreground">
            Manage navigation menus • Drag to reorder items
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sidebar - Menu list */}
          <div className="lg:col-span-1">
            <MenuList
              menus={menus}
              selectedMenuId={selectedMenuId}
              onSelectMenu={setSelectedMenuId}
            />
          </div>

          {/* Main editor area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Header with add button */}
            <div className="flex items-center justify-between bg-card border border-border rounded-lg p-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedMenu?.label || selectedMenuId}
                </h2>
                {selectedMenu?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedMenu.description}
                  </p>
                )}
              </div>
              <Button onClick={handleAddItem}>
                <span className="mr-2">➕</span> Add Item
              </Button>
            </div>

            {/* Menu items list */}
            <div className="bg-card border border-border rounded-lg p-4">
              {rootItems.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p className="mb-4">No items in this menu yet.</p>
                  <Button onClick={handleAddItem} variant="outline">
                    Add First Item
                  </Button>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <DroppableContainer droppableId="menu-items">
                    {(provided) => (
                      <>
                        {rootItems.map((item, index) => renderItem(item, index, 0))}
                        {provided.placeholder}
                      </>
                    )}
                  </DroppableContainer>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item form dialog */}
      <MenuItemForm
        open={showItemForm}
        onOpenChange={setShowItemForm}
        item={editingItem}
        onSave={handleSaveItem}
        mode={formMode}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(open) => !open && setDeleteConfirm(null)}
        title="Delete Menu Item?"
        description="This will also delete all submenu items. This action cannot be undone."
        variant="destructive"
        onConfirm={() => {
          if (deleteConfirm) {
            handleDeleteItem(deleteConfirm);
            setDeleteConfirm(null);
          }
        }}
      />
    </div>
  );
}

