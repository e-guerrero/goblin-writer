// FlashcardListComponent.tsx
import FlashcardListItemComponent from "./FlashcardListItemComponent.tsx";
import "./styles.css";

interface FlashCardListProps {
  flashcards: any[];
}

const FlashcardListComponent: React.FC<FlashCardListProps> = ({
  flashcards,
}) => {
  return (
    <div className="list">
      {flashcards.length === 0 ? (
        <p>No flashcards found.</p>
      ) : (
        flashcards.map((flashcard) => (
          <FlashcardListItemComponent
            key={flashcard.id}
            flashcard={flashcard}
          />
        ))
      )}
    </div>
  );
};

export default FlashcardListComponent;
