// FlashcardDetailViewComponent.tsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { pb } from "../lib/pocketbase";
import "./styles.css";

interface FlashcardFront {
  id: string;
  directory: string;
  sequential: number;
  name: string;
  youtube?: string;
  github?: string;
  blog?: string;
  muted: boolean;
  memory: number;
  lastStudied?: string;
  richText?: string;
  image?: string;
  video?: string;
  subtitles?: string;
}

interface FlashcardBack {
  id: string;
  flashcardFront: string;
  sequential: number;
  richText?: string;
  code?: string;
  image?: string;
  video?: string;
  audio?: string;
  file?: string;
  resource?: string;
  subtitles?: string;
}

const FlashcardDetailView = () => {
  const { id, side } = useParams<{ id?: string; side?: "front" | "back" }>();
  const [flashcardFronts, setFlashcardFronts] = useState<FlashcardFront[]>([]);
  const [flashcardBacks, setFlashcardBacks] = useState<FlashcardBack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [viewSide, setViewSide] = useState<string>(side || "front");
  const [backButtonText, setBackButtonText] =
    useState<string>("Loading the Back");
  const [backButtonDisabled, setBackButtonDisabled] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (flashcardFronts.length === 0) fetchFlashcardFronts();
  }, []);

  useEffect(() => {
    if (flashcardFronts.length > 0 && flashcardFronts[currentIndex])
      fetchFlashcardBacks();
  }, [flashcardFronts, currentIndex]); // Runs when the component loads and when `id` changes

  useEffect(() => {
    if (viewSide === "back" && flashcardBacks.length === 0) {
      fetchFlashcardBacks();
    }
  }, [viewSide, currentIndex]);

  const fetchFlashcardFronts = async () => {
    try {
      const record = await pb
        .collection("flashcardFronts")
        .getOne<FlashcardFront>(id as string);
      const records = await pb
        .collection("flashcardFronts")
        .getFullList<FlashcardFront>({
          filter: `directory = "${record.directory}"`,
          sort: "sequential",
        });
      setFlashcardFronts(records);
      setCurrentIndex(records.findIndex((fc) => fc.id === id));
    } catch (error) {
      console.error("Failed to fetch flashcard fronts:", error);
    }
  };

  // const fetchFlashcardBacks = async () => {
  //   try {
  //     const records = await pb
  //       .collection("flashcardBackItems")
  //       .getFullList<FlashcardBack>({
  //         filter: `flashcardFront = "${flashcardFronts[currentIndex].id}"`,
  //         sort: "sequential",
  //       });
  //     setFlashcardBacks(records);
  //   } catch (error) {
  //     console.error("Failed to fetch flashcard backs:", error);
  //   }
  // };

  const fetchFlashcardBacks = async () => {
    try {
      setBackButtonText("Loading the Back"); // Show loading state initially
      setBackButtonDisabled(true); // Disable button while fetching

      if (!flashcardFronts[currentIndex]) return; // Ensure `flashcardFronts` is set before fetching backs

      const records = await pb
        .collection("flashcardBackItems")
        .getFullList<FlashcardBack>({
          filter: `flashcardFront = "${flashcardFronts[currentIndex].id}"`,
          sort: "sequential",
        });

      setFlashcardBacks(records);

      if (records.length > 0) {
        setBackButtonText(`Back (${records.length})`);
        setBackButtonDisabled(false); // Enable button if there are flashcard backs
      } else {
        setBackButtonText("Back (empty)");
      }
    } catch (error) {
      console.error("Failed to fetch flashcard backs:", error);
      setBackButtonText("Back (error)");
    }
  };

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

  const navigateFlashcard = (direction: "prev" | "next") => {
    setFlashcardBacks([]);
    const newIndex = direction === "next" ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < flashcardFronts.length) {
      setCurrentIndex(newIndex);
      setViewSide("front");
    } else if (newIndex < 0) {
      setCurrentIndex(flashcardFronts.length - 1);
      setViewSide("front");
    } else if (newIndex >= flashcardFronts.length) {
      setCurrentIndex(0);
      setViewSide("front");
    }
  };

  if (!flashcardFronts.length) return <p>Loading...</p>;
  const flashcardFront = flashcardFronts[currentIndex];

  return (
    <div className="flashcard-detail">
      <div className="flashcard-content-header">
        <button
          onClick={() => navigate(`/directories/${flashcardFront?.directory}`)}
        >
          Back to Directory
        </button>
        <button
          onClick={() =>
            navigate(
              `/directories/${undefined}/create-edit-flashcard/${undefined}/${flashcardFront.id}`
            )
          }
        >
          Edit
        </button>
        <h2>{viewSide === "front" ? "Flashcard Front" : "Flashcard Back"}</h2>
        <p>
          <strong>Name:</strong> {flashcardFront.name}
        </p>
        <p>
          <strong>Memory Level:</strong> {flashcardFront.memory}
        </p>
        <p>
          <strong>Last Studied:</strong> {flashcardFront.lastStudied}
        </p>
      </div>

      {viewSide === "front" && (
        <div className="flashcard-content scrollable">
          {flashcardFront.richText && (
            <>
              <p>
                <strong>Rich Text: </strong>
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: flashcardFront.richText }}
              />
            </>
          )}
          {flashcardFront.image && (
            <img
              src={pb.files.getURL(flashcardFront, flashcardFront.image)}
              alt="Flashcard"
            />
          )}
          {flashcardFront.video && (
            <video controls width="100%" style={{ marginTop: "10px" }}>
              <source
                src={pb.files.getURL(flashcardFront, flashcardFront.video)}
                type={getMimeType(flashcardFront.video)}
              />
              Your browser does not support the video tag.
            </video>
          )}
          {flashcardFront.subtitles && (
            <>
              <p>
                <strong>Subtitles: </strong>
              </p>
              <div
                dangerouslySetInnerHTML={{ __html: flashcardFront.subtitles }}
              />
            </>
          )}
        </div>
      )}

      {viewSide === "back" && flashcardBacks.length > 0 && (
        <div className="flashcard-content scrollable">
          {flashcardBacks.map((back) => (
            <div key={back.id} className="flashcard-back-item">
              {back.richText && back.video && (
                <>
                  <p>Subtitles: </p>
                  <div dangerouslySetInnerHTML={{ __html: back.richText }} />
                </>
              )}
              {back.richText && !back.video && (
                <>
                  <p>Rich Text: </p>
                  <div dangerouslySetInnerHTML={{ __html: back.richText }} />
                </>
              )}
              {back.image && (
                <img src={pb.files.getURL(back, back.image)} alt="image" />
              )}
              {back.video && (
                <video controls width="100%" style={{ marginTop: "10px" }}>
                  <source
                    src={pb.files.getURL(back, back.video)}
                    type={getMimeType(back.video)}
                  />
                  Your browser does not support the video tag.
                </video>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="toggle-navigation">
        <div className="toggle-switch">
          <button
            className={`toggle-button ${viewSide === "front" ? "active" : ""}`}
            onClick={() => setViewSide("front")}
          >
            Front
          </button>
          {/* <button
            className={`toggle-button ${viewSide === "back" ? "active" : ""}`}
            onClick={() => setViewSide("back")}
          >
            Back
          </button> */}
          <button
            className={`toggle-button ${viewSide === "back" ? "active" : ""}`}
            onClick={() => setViewSide("back")}
            disabled={backButtonDisabled}
          >
            {backButtonText}
          </button>
        </div>

        <button
          onClick={() => navigateFlashcard("prev")}
          // disabled={currentIndex === 0}
        >
          &lt;
        </button>
        <button
          onClick={() => navigateFlashcard("next")}
          // disabled={currentIndex === flashcardFronts.length - 1}
        >
          &gt;
        </button>
      </div>
    </div>
  );
};

export default FlashcardDetailView;
