// FlashcardListItemComponent.tsx
import { useState } from "react";
import "./styles.css";
import { RecordModel } from "pocketbase";
import { pb } from "../lib/pocketbase";
import { useNavigate } from "react-router-dom";

interface FlashCardListItemProps {
  flashcard: RecordModel;
}

const FlashcardListItemComponent: React.FC<FlashCardListItemProps> = ({
  flashcard,
}) => {
  const [expanded, setExpanded] = useState(false);
  const markup = { __html: flashcard.richText };
  // const url = pb.files.getUrl(record, firstFilename, {'thumb': '100x250'});
  const url = pb.files.getURL(flashcard, flashcard.image);

  const navigate = useNavigate();

  const getMimeType = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "mp4":
        return "video/mp4";
      case "webm":
        return "video/webm";
      case "ogg":
        return "video/ogg";
      case "mov":
        return "video/quicktime";
      case "avi":
        return "video/x-msvideo";
      default:
        return "video/mp4";
    }
  };

  // Flashcard Back is uses a different ID from flashcard front. The back ID
  // is associated with the front ID. Pass the front ID to get the back ID
  // in the new window.
  const handleClick = () => {
    if (expanded) {
      navigate(`/flashcard/${flashcard.id}/back`);
    } else {
      navigate(`/flashcard/${flashcard.id}/front`);
    }
  };

  return (
    <div className="flashcard-item">
      <div className="flashcard-content" onClick={handleClick}>
        <span>{flashcard.name}</span>
        <span> Memory: {flashcard.memory}</span>
        <span>{flashcard.lastStudied}</span>
        {flashcard.richText || flashcard.image || flashcard.video ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
          >
            ▼
          </button>
        ) : null}
      </div>
      {expanded && (
        <div className="flashcard-details">
          {flashcard.image && <img src={url} alt="Flashcard" />}
          {flashcard.video && (
            <video controls width="100%" style={{ marginTop: "10px" }}>
              <source
                src={pb.files.getURL(flashcard, flashcard.video)}
                type={getMimeType(flashcard.video)}
              />
              Your browser does not support the video tag.
            </video>
          )}
          {flashcard.richText && <div dangerouslySetInnerHTML={markup} />}
        </div>
      )}
    </div>
  );
};

export default FlashcardListItemComponent;
