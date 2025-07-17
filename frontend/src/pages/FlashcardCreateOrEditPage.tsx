// FlashcardCreateOrEditPage.tsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FlashcardFrontCreateOrEditComponent from "../components/FlashcardFrontCreateOrEditComponent";
import FlashcardBackCreateOrEditComponent from "../components/FlashcardBackCreateOrEditComponent";
import styles from "./FlashcardCreateOrEditPage.module.css";

interface FlashcardCreateParams {
  "directory-id"?: string;
  sequential?: string;
  "flashcard-front-id"?: string;
  [key: string]: string | undefined;
}

const FlashcardCreateOrEditPage: React.FC = () => {
  // Read URL parameters. In create mode, a directory id and sequential are provided.
  // In edit mode, a flashcard-front id is provided.
  const {
    "directory-id": directoryId,
    sequential: sequential,
    "flashcard-front-id": routeFrontId,
  } = useParams<FlashcardCreateParams>();
  const navigate = useNavigate();

  // Hold the flashcard front id. (If already provided in the URL, use it.)
  const [frontId, setFrontId] = useState<string | undefined>(routeFrontId);
  // Active side: either 'front' or 'back'. Front is shown by default.
  const [activeSide, setActiveSide] = useState<"front" | "back">("front");

  // Callback from FlashcardFrontCreateOrEditComponent once a record is successfully created.
  const handleFrontCreated = (newFrontId: string) => {
    setFrontId(newFrontId);
  };

  // "Done" button: navigate to the appropriate route.
  const handleDone = () => {
    if (frontId) {
      navigate(`/flashcard/${frontId}/front`);
    } else {
      navigate(`/directories/${directoryId}`);
    }
  };

  // Switch to front side.
  const handleSwitchToFront = () => {
    setActiveSide("front");
  };

  // Switch to back side. (Back button is enabled only if a front id exists.)
  const handleSwitchToBack = () => {
    if (frontId) {
      setActiveSide("back");
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.contentArea}>
        {activeSide === "front" ? (
          <FlashcardFrontCreateOrEditComponent
            directoryId={directoryId}
            sequential={sequential ? parseInt(sequential, 10) : undefined}
            flashcardFrontId={frontId}
            onFrontCreated={handleFrontCreated}
          />
        ) : (
          <FlashcardBackCreateOrEditComponent flashcardFrontId={frontId!} />
        )}
      </div>
      <div className={styles.bottomBar}>
        <button onClick={handleDone}>Done</button>
        <button onClick={handleSwitchToFront} disabled={activeSide === "front"}>
          Front
        </button>
        <button
          onClick={handleSwitchToBack}
          disabled={!frontId || activeSide === "back"}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default FlashcardCreateOrEditPage;
