import { useState, useEffect } from "react";
import { pb } from "./pocketbase";

// interface Directory {
//   id: string;
//   name: string;
//   parentDirectory?: string;
// }

// interface Flashcard {
//   id: string;
//   sequential: number;
//   name: string;
//   resourceUrls: string[];
//   memory: number;
//   lastStudied: string;
//   description?: string;
//   image?: string;
// }

export const useDirectories = (userId: string) => {
  const [directories, setDirectories] = useState<any[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allDirectories = await pb
          .collection("Directory")
          .getFullList({ filter: `userId = "${userId}"` });
        setDirectories(allDirectories);
      } catch (err) {
        setError("Failed to fetch directories.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const getSubdirectories = (parentId: string) => {
    return directories.filter((dir) => dir.parentDirectory === parentId);
  };

  const getFlashcards = async (directoryId: string) => {
    try {
      const flashcardData = await pb
        .collection("Flashcard")
        .getFullList({ filter: `directoryId = "${directoryId}"` });
      setFlashcards(flashcardData);
    } catch (err) {
      setError("Failed to fetch flashcards.");
      console.error(err);
    }
  };

  return {
    directories,
    getSubdirectories,
    flashcards,
    getFlashcards,
    loading,
    error,
  };
};
