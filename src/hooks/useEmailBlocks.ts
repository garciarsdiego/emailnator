import { useState, useCallback } from "react";
import { EmailBlock, BlockType, DEFAULT_BLOCKS } from "@/types/emailBuilder";

export function useEmailBlocks(initialBlocks: EmailBlock[] = []) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialBlocks);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = useCallback((type: BlockType, position?: number) => {
    const newBlock: EmailBlock = {
      id: crypto.randomUUID(),
      type,
      content: { ...DEFAULT_BLOCKS[type] },
      position: position ?? blocks.length,
    };

    setBlocks((prev) => {
      const updated = [...prev];
      if (position !== undefined) {
        updated.splice(position, 0, newBlock);
        // Update positions
        return updated.map((block, index) => ({ ...block, position: index }));
      }
      return [...prev, newBlock];
    });

    setSelectedBlockId(newBlock.id);
    return newBlock.id;
  }, [blocks.length]);

  const updateBlock = useCallback((id: string, content: Partial<EmailBlock["content"]>) => {
    setBlocks((prev) =>
      prev.map((block) =>
        block.id === id
          ? { ...block, content: { ...block.content, ...content } }
          : block
      )
    );
  }, []);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((block) => block.id !== id);
      return filtered.map((block, index) => ({ ...block, position: index }));
    });
    if (selectedBlockId === id) {
      setSelectedBlockId(null);
    }
  }, [selectedBlockId]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    setBlocks((prev) => {
      const updated = [...prev];
      const [removed] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, removed);
      return updated.map((block, index) => ({ ...block, position: index }));
    });
  }, []);

  const duplicateBlock = useCallback((id: string) => {
    const block = blocks.find((b) => b.id === id);
    if (!block) return;

    const newBlock: EmailBlock = {
      ...block,
      id: crypto.randomUUID(),
      position: block.position + 1,
    };

    setBlocks((prev) => {
      const updated = [...prev];
      updated.splice(block.position + 1, 0, newBlock);
      return updated.map((b, index) => ({ ...b, position: index }));
    });

    setSelectedBlockId(newBlock.id);
  }, [blocks]);

  const clearBlocks = useCallback(() => {
    setBlocks([]);
    setSelectedBlockId(null);
  }, []);

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) || null;

  return {
    blocks,
    setBlocks,
    selectedBlockId,
    setSelectedBlockId,
    selectedBlock,
    addBlock,
    updateBlock,
    removeBlock,
    moveBlock,
    duplicateBlock,
    clearBlocks,
  };
}
