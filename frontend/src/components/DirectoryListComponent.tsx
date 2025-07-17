// DirectoryListComponent.tsx
import { useEffect, useState } from "react";
import { pb } from "../lib/pocketbase"; // PocketBase client
import FlashcardListComponent from "./FlashcardListComponent";
import "./styles.css";
import { RecordModel } from "pocketbase";
import { useNavigate, useParams } from "react-router-dom";

const DirectoryList = () => {
  // Grab the optional directory id from the URL (if any)
  const { id: initialDirId } = useParams<{ id: string }>();

  const [directories, setDirectories] = useState<RecordModel[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  // currentPath will store the directory IDs (in order)
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  // currentPathName stores the corresponding names for the breadcrumb
  const [currentPathName, setCurrentPathName] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state: track whether flashcards are currently being loaded
  const [flashcardsLoading, setFlashcardsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch directories from the API when the component loads
  useEffect(() => {
    fetchDirectories();
  }, []);

  // Filtering not needed. The API rule below was set in Pocketbase dashboard...
  // @request.auth.id != "" && user = @request.auth.id
  const fetchDirectories = async () => {
    setLoading(true);
    try {
      const allDirectories = await pb.collection("directories").getFullList();
      setDirectories(allDirectories);
    } catch (err) {
      setError("Failed to fetch directories.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Utility function: Given a directory id, walk up its parentDirectory chain
  // and return an array of {id, name} objects from the root to that directory.
  const getFullPath = (directoryId: string): { id: string; name: string }[] => {
    const path: { id: string; name: string }[] = [];
    let current = directories.find((dir) => dir.id === directoryId);
    while (current) {
      // Unshift to add at the beginning so that the root is first
      path.unshift({ id: current.id, name: current.name });
      // If there’s no parentDirectory, we’ve reached the top
      if (!current.parentDirectory) break;
      current = directories.find((dir) => dir.id === current?.parentDirectory);
    }
    return path;
  };

  // Once the directories are loaded, if an initial directory id was passed,
  // set the breadcrumb (currentPath and currentPathName) accordingly.
  useEffect(() => {
    if (directories.length > 0 && initialDirId) {
      const fullPath = getFullPath(initialDirId);
      const newPath = fullPath.map((d) => d.id);
      const newPathNames = fullPath.map((d) => d.name);
      setCurrentPath(newPath);
      setCurrentPathName(newPathNames);
      // Also, if this directory has no subdirectories, fetch its flashcards.
      const subDirs = getSubdirectories(initialDirId);
      if (subDirs.length === 0) {
        fetchFlashcards(initialDirId);
      }
    }
  }, [directories, initialDirId]);

  const fetchFlashcards = async (directoryId: string) => {
    setFlashcardsLoading(true);
    try {
      const flashcardData = await pb.collection("flashcardFronts").getFullList({
        filter: `directory = "${directoryId}"`,
        sort: "sequential",
      });
      setFlashcards(flashcardData);
    } catch (err) {
      setError("Failed to fetch flashcards.");
      console.error(err);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  // Given a parent directory id, return its immediate subdirectories.
  const getSubdirectories = (parentId: string) => {
    return directories.filter((dir) => dir.parentDirectory === parentId);
  };

  // When clicking on a directory, add it to the current path.
  const handleNavigate = (directoryId: string) => {
    const subDirs = getSubdirectories(directoryId);
    const directory = directories.find((dir) => dir.id === directoryId);
    const directoryName = directory ? directory.name : "";
    setCurrentPath([...currentPath, directoryId]);
    setCurrentPathName([...currentPathName, directoryName]);

    if (subDirs.length === 0) {
      fetchFlashcards(directoryId);
    }
  };

  // The back button removes the last directory from the current path.
  const handleBack = () => {
    setCurrentPath(currentPath.slice(0, -1));
    setCurrentPathName(currentPathName.slice(0, -1));
    // Optionally clear flashcards if backing up a level.
    setFlashcards([]);
  };

  // Determine the “current” directory for which to show children.
  const currentDirectoryId =
    currentPath.length > 0 ? currentPath[currentPath.length - 1] : "";
  const currentSubDirectories = getSubdirectories(currentDirectoryId);

  // -----------------------------------------------
  // Button Visibility Logic Based on Conditions
  // -----------------------------------------------
  // Define "depth" as the number of directories in the currentPath.
  const depth = currentPath.length; // 0: root, 1: one level deep, etc.

  let showDirectoryButton = false;
  let showFlashcardButton = false;

  if (depth < 2) {
    // Condition 1:
    // If the current directory is root or 1 level deep, show only the Directory button.
    showDirectoryButton = true;
  } else if (depth >= 2 && depth < 4) {
    // For 2-4 levels deep:
    if (currentSubDirectories.length === 0 && flashcards.length === 0) {
      // Condition 2:
      // No directories and no flashcards exist → show both buttons.
      showDirectoryButton = true;
      showFlashcardButton = true;
    } else if (flashcards.length > 0) {
      // Condition 3:
      // Flashcards already exist → show only the Flashcard button.
      showFlashcardButton = true;
    } else if (currentSubDirectories.length > 0) {
      // Condition 4:
      // Directories already exist → show only the Directory button.
      showDirectoryButton = true;
    }
  } else if (depth === 4) {
    // Condition 5:
    // 5 levels deep → only show the Flashcard button.
    showFlashcardButton = true;
  }

  // Handlers for the new action buttons.
  const handleCreateDirectory = () => {
    // TODO: Implement functionality to create a new Directory.
    console.log("Create Directory clicked");
    navigate(`/directories/create-edit-directory/`);
    if (currentDirectoryId === "") {
      navigate(`/directories/create-edit-directory/`);
    } else {
      navigate(`/directories/${currentDirectoryId}/create-edit-directory/`);
    }
  };

  const handleCreateFlashcard = () => {
    // TODO: Implement functionality to create a new Flashcard.
    console.log("Create Flashcard clicked");
    navigate(
      `/directories/${currentDirectoryId}/create-edit-flashcard/${
        flashcards.length + 1
      }/`
    );
  };

  return (
    <div className="directory-container">
      {/* Breadcrumb Navigation */}
      <div className="nav-bar">
        {currentPath.length > 0 && <button onClick={handleBack}>Back</button>}
        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        <span className="breadcrumb">
          {currentPathName.length > 0 ? currentPathName.join(" / ") : ""}
        </span>
      </div>

      {/* Error Message */}
      {error && <p className="error-message">{error}</p>}

      {/* Directory or Flashcard List */}
      <div className="list-container">
        {loading ? (
          <p>Loading...</p>
        ) : currentSubDirectories.length > 0 ? (
          currentSubDirectories.map((dir) => (
            <button
              key={dir.id}
              className="list-item"
              onClick={() => handleNavigate(dir.id)}
            >
              {dir.name}
            </button>
          ))
        ) : (
          <FlashcardListComponent flashcards={flashcards} />
        )}
      </div>

      {/* Action Buttons anchored at the bottom */}
      {/* Only render the action buttons once flashcards have finished loading */}
      {!flashcardsLoading && (
        <div className="action-buttons">
          {showDirectoryButton && (
            <button className="action-button" onClick={handleCreateDirectory}>
              Directory
            </button>
          )}
          {showFlashcardButton && (
            <button className="action-button" onClick={handleCreateFlashcard}>
              Flashcard
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DirectoryList;
