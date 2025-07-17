import React, { useState, useEffect } from "react";
import { pb } from "../lib/pocketbase";
import FlashcardBackListItemComponent, {
  BackItemData,
  BackItemType,
} from "./FlashcardBackListItemComponent";
import styles from "./FlashcardBackCreateOrEditComponent.module.css";

interface FlashcardBackProps {
  flashcardFrontId: string;
}

// Helper function: derive the type from the record's fields.
const deriveBackItemType = (item: any): BackItemType => {
  if (item.code) return "Code";
  if (item.resource) return "Url";
  if (item.video) return "Video";
  if (item.image) return "Image";
  if (item.audio) return "Audio";
  if (item.file) return "File";
  // If only richText is present, then it's Rich Text.
  return "Rich Text";
};

const FlashcardBackCreateOrEditComponent: React.FC<FlashcardBackProps> = ({
  flashcardFrontId,
}) => {
  const [backItems, setBackItems] = useState<BackItemData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBackItems = async () => {
    setLoading(true);
    try {
      const items = await pb.collection("flashcardBackItems").getFullList({
        filter: `flashcardFront = "${flashcardFrontId}"`,
        sort: "sequential",
      });
      // Map records and derive type based on non-null fields.
      const mapped: BackItemData[] = items.map((item: any) => ({
        id: item.id,
        type: deriveBackItemType(item), // derive type here
        sequential: item.sequential,
        data: item,
      }));
      mapped.sort((a, b) => a.sequential - b.sequential);
      setBackItems(mapped);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch back items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackItems();
  }, [flashcardFrontId]);

  // When a type button is clicked, add a new empty back item locally.
  const handleAddNewItem = (type: BackItemType) => {
    const newItem: BackItemData = {
      id: "", // empty id indicates not yet created
      type,
      sequential: backItems.length + 1,
      data: {},
    };
    setBackItems((prev) => [...prev, newItem]);
  };

  // Callback for when an item changes (create/update/delete) via API.
  const handleItemChanged = () => {
    fetchBackItems();
  };

  // Callback for when an unsaved item is deleted locally.
  const handleLocalDelete = (index: number) => {
    setBackItems((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.backContainer}>
      <h2>Flashcard Back Items</h2>
      <div className={styles.typeButtonsRow}>
        {(
          [
            "Rich Text",
            "Code",
            "Image",
            "Video",
            "Audio",
            "File",
            "Url",
          ] as BackItemType[]
        ).map((option) => (
          <button key={option} onClick={() => handleAddNewItem(option)}>
            {option}
          </button>
        ))}
      </div>
      <div className={styles.backList}>
        {loading && <p>Loading</p>}
        {!loading && backItems.length === 0 && <p>Empty</p>}
        {!loading &&
          backItems.map((item, index) => (
            // Use a composite key so that type information is preserved.
            <FlashcardBackListItemComponent
              key={`${item.sequential}-${item.type}`}
              flashcardFrontId={flashcardFrontId}
              initialData={item}
              onItemChanged={handleItemChanged}
              onLocalDelete={() => handleLocalDelete(index)}
            />
          ))}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </div>
  );
};

export default FlashcardBackCreateOrEditComponent;
