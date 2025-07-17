// FlashcardFrontCreateOrEditComponent.tsx
import React, { useState, useEffect } from "react";
import { pb } from "../lib/pocketbase";
import styles from "./FlashcardFrontCreateOrEditComponent.module.css";

interface FlashcardFrontProps {
  directoryId?: string;
  sequential?: number;
  flashcardFrontId?: string;
  onFrontCreated: (id: string) => void;
}

const FlashcardFrontCreateOrEditComponent: React.FC<FlashcardFrontProps> = ({
  directoryId,
  sequential,
  flashcardFrontId,
  onFrontCreated,
}) => {
  // Local record id. In create mode, this is initially undefined.
  const [recordId, setRecordId] = useState<string | undefined>(
    flashcardFrontId
  );
  // Mandatory fields
  const [name, setName] = useState<string>("");
  const [memory, setMemory] = useState<number>(0);
  const [muted, setMuted] = useState<boolean>(false);
  // Optional text fields
  const [richText, setRichText] = useState<string>("");
  const [subtitles, setSubtitles] = useState<string>("");
  // Optional URL fields
  const [youtube, setYoutube] = useState<string>("");
  const [github, setGithub] = useState<string>("");
  const [blog, setBlog] = useState<string>("");
  // File fields
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);

  // Button and form state
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [createButtonVisible, setCreateButtonVisible] =
    useState<boolean>(false);
  const [createButtonDisabled, setCreateButtonDisabled] =
    useState<boolean>(true);
  const [createButtonText, setCreateButtonText] = useState<string>("Create");

  const [editButtonVisible, setEditButtonVisible] = useState<boolean>(false);
  const [editButtonDisabled, setEditButtonDisabled] = useState<boolean>(true);
  const [updateButtonVisible, setUpdateButtonVisible] =
    useState<boolean>(false);
  const [updateButtonDisabled, setUpdateButtonDisabled] =
    useState<boolean>(true);
  const [updateButtonText, setUpdateButtonText] = useState<string>("Update");

  const [deleteButtonVisible, setDeleteButtonVisible] =
    useState<boolean>(false);
  const [deleteButtonDisabled, setDeleteButtonDisabled] =
    useState<boolean>(false);

  useEffect(() => {
    if (recordId) {
      // Edit mode: fetch the record to prepopulate fields.
      const fetchRecord = async () => {
        try {
          const record = await pb
            .collection("flashcardFronts")
            .getOne(recordId);
          setName(record.name);
          setRichText(record.richText || "");
          setSubtitles(record.subtitles || "");
          setMemory(record.memory || 0);
          setMuted(record.muted || false);
          setYoutube(record.youtube || "");
          setGithub(record.github || "");
          setBlog(record.blog || "");
          // Optionally, set file previews if record has file URLs.
          if (record.video) {
            const videoUrl = pb.getFileUrl(record, record.video);
            setVideoPreview(videoUrl);
          }
        } catch (err) {
          console.error(err);
          setFormError("Record not found.");
        }
      };
      fetchRecord();
      setIsFormEditable(false);
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      setUpdateButtonVisible(true);
      setUpdateButtonDisabled(true);
      setCreateButtonVisible(false);
      setDeleteButtonVisible(true);
      setDeleteButtonDisabled(false);
    } else {
      // Create mode: enable editing immediately.
      setIsFormEditable(true);
      setCreateButtonVisible(true);
      setCreateButtonDisabled(false);
      setEditButtonVisible(false);
      setUpdateButtonVisible(false);
      setDeleteButtonVisible(false);
    }
  }, [recordId]);

  // Handlers for file inputs.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setAudioPreview(URL.createObjectURL(file));
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  // A generic change handler for text/textarea fields.
  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<any>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      if (recordId) setUpdateButtonDisabled(false);
    };

  // Create button handler.
  const handleCreate = async () => {
    setFormError(null);
    setCreateButtonDisabled(true);
    if (!name.trim()) {
      setFormError("Name is required.");
      setCreateButtonDisabled(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("richText", richText);
      formData.append("subtitles", subtitles);
      formData.append("memory", memory.toString());
      formData.append("muted", muted ? "true" : "false");
      formData.append("sequential", sequential ? sequential.toString() : "1");
      if (directoryId) {
        formData.append("directory", directoryId);
      }
      if (youtube) formData.append("youtube", youtube);
      if (github) formData.append("github", github);
      if (blog) formData.append("blog", blog);
      if (imageFile) formData.append("image", imageFile);
      if (videoFile) formData.append("video", videoFile);
      if (audioFile) formData.append("audio", audioFile);

      const record = await pb.collection("flashcardFronts").create(formData);
      setRecordId(record.id);
      setCreateButtonText("Saved");
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      setDeleteButtonVisible(true);
      // Notify the parent component that a front record has been created.
      onFrontCreated(record.id);
    } catch (err) {
      console.error(err);
      setFormError("Failed to create the record.");
      setCreateButtonDisabled(false);
    }
  };

  const handleEdit = () => {
    setEditButtonDisabled(true);
    setIsFormEditable(true);
    setUpdateButtonText("Update");
    setUpdateButtonVisible(true);
    setUpdateButtonDisabled(false);
  };

  const handleUpdate = async () => {
    setFormError(null);
    setUpdateButtonDisabled(true);
    setIsFormEditable(false);
    if (!name.trim()) {
      setFormError("Name is required.");
      setUpdateButtonDisabled(false);
      setIsFormEditable(true);
      return;
    }
    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("richText", richText);
      formData.append("subtitles", subtitles);
      formData.append("memory", memory.toString());
      formData.append("muted", muted ? "true" : "false");
      if (youtube) formData.append("youtube", youtube);
      if (github) formData.append("github", github);
      if (blog) formData.append("blog", blog);
      if (imageFile) formData.append("image", imageFile);
      if (videoFile) formData.append("video", videoFile);
      if (audioFile) formData.append("audio", audioFile);

      await pb.collection("flashcardFronts").update(recordId!, formData);
      setUpdateButtonText("Updated");
      setEditButtonDisabled(false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to update the record.");
      setUpdateButtonDisabled(false);
      setIsFormEditable(true);
    }
  };

  const handleDelete = async () => {
    setFormError(null);
    setDeleteButtonDisabled(true);
    try {
      await pb.collection("flashcardFronts").delete(recordId!);
      // Clear fields after deletion.
      setRecordId(undefined);
      setName("");
      setRichText("");
      setSubtitles("");
      setMemory(0);
      setMuted(false);
      setYoutube("");
      setGithub("");
      setBlog("");
      setImageFile(null);
      setVideoFile(null);
      setAudioFile(null);
      setImagePreview(null);
      setVideoPreview(null);
      setAudioPreview(null);
      setDeleteButtonVisible(false);
      // Reset the create button text and ensure it is visible and enabled.
      setCreateButtonText("Create");
      setCreateButtonDisabled(false);
      setCreateButtonVisible(true);
    } catch (err) {
      console.error(err);
      setFormError("Failed to delete the record.");
      setDeleteButtonDisabled(false);
    }
  };

  return (
    <div className={styles.frontContainer}>
      <h2>{recordId ? "Edit Flashcard Front" : "Create Flashcard Front"}</h2>
      {formError && <p className={styles.errorMessage}>{formError}</p>}
      <div className={styles.scrollableForm}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className={styles.formGroup}>
            <label htmlFor="ff-name">Name (required):</label>
            <input
              id="ff-name"
              type="text"
              value={name}
              onChange={handleInputChange(setName)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-richText">Description (optional):</label>
            <textarea
              id="ff-richText"
              value={richText}
              onChange={handleInputChange(setRichText)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-memory">Memory (0-10):</label>
            <input
              id="ff-memory"
              type="number"
              value={memory}
              min="0"
              max="10"
              onChange={(e) => {
                // setMemory(Number(e.target.value));
                const value =
                  e.target.value === "" ? 0 : Number(e.target.value);
                setMemory(Math.min(10, Math.max(0, value)));
              }}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-muted">Muted:</label>
            <input
              id="ff-muted"
              type="checkbox"
              checked={muted}
              onChange={(e) => setMuted(e.target.checked)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-youtube">YouTube (optional):</label>
            <input
              id="ff-youtube"
              type="url"
              value={youtube}
              onChange={handleInputChange(setYoutube)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-github">GitHub (optional):</label>
            <input
              id="ff-github"
              type="url"
              value={github}
              onChange={handleInputChange(setGithub)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-blog">Blog (optional):</label>
            <input
              id="ff-blog"
              type="url"
              value={blog}
              onChange={handleInputChange(setBlog)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-image">Image (optional):</label>
            <input
              id="ff-image"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={!isFormEditable}
            />
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className={styles.previewImage}
              />
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-video">Video (optional):</label>
            <input
              id="ff-video"
              type="file"
              accept="video/*"
              onChange={handleVideoChange}
              disabled={!isFormEditable}
            />
            {videoPreview && (
              <video
                src={videoPreview}
                controls
                className={styles.previewVideo}
              />
            )}
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-subtitles">Subtitles (optional):</label>
            <textarea
              id="ff-subtitles"
              value={subtitles}
              onChange={handleInputChange(setSubtitles)}
              disabled={!isFormEditable}
            />
          </div>
          <div className={styles.formGroup}>
            <label htmlFor="ff-audio">Audio (optional):</label>
            <input
              id="ff-audio"
              type="file"
              accept="audio/*"
              onChange={handleAudioChange}
              disabled={!isFormEditable}
            />
            {audioPreview && (
              <audio
                src={audioPreview}
                controls
                className={styles.previewAudio}
              />
            )}
          </div>
        </form>
      </div>
      <div className={styles.buttonRow}>
        {deleteButtonVisible && (
          <button onClick={handleDelete} disabled={deleteButtonDisabled}>
            Delete
          </button>
        )}
        {!recordId && createButtonVisible && (
          <button onClick={handleCreate} disabled={createButtonDisabled}>
            {createButtonText}
          </button>
        )}
        {recordId && editButtonVisible && (
          <button onClick={handleEdit} disabled={editButtonDisabled}>
            Edit
          </button>
        )}
        {recordId && updateButtonVisible && (
          <button onClick={handleUpdate} disabled={updateButtonDisabled}>
            {updateButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default FlashcardFrontCreateOrEditComponent;
