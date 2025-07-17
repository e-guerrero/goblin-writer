import React, { useState, useEffect } from "react";
import { pb } from "../lib/pocketbase";
import styles from "./FlashcardBackListItemComponent.module.css";

export type BackItemType =
  | "Rich Text"
  | "Code"
  | "Image"
  | "Video"
  | "Audio"
  | "File"
  | "Url";

export interface BackItemData {
  id: string; // empty string if not yet created
  type: BackItemType; // maintained locally in the UI
  sequential: number;
  data: any;
}

interface FlashcardBackListItemProps {
  flashcardFrontId: string;
  initialData: BackItemData;
  onItemChanged: () => void; // Called when a saved item changes (create/update/delete)
  onLocalDelete: () => void; // Called when an unsaved item should be removed locally
}

const FlashcardBackListItemComponent: React.FC<FlashcardBackListItemProps> = ({
  flashcardFrontId,
  initialData,
  onItemChanged,
  onLocalDelete,
}) => {
  // Local state for the back item.
  const [recordId, setRecordId] = useState<string>(initialData.id);
  // Store the type from initialData and never change it.
  const [localType] = useState<BackItemType>(initialData.type);
  const [sequential] = useState<number>(initialData.sequential);
  // For most types, textValue holds the description. For Url type, we'll use textValue for description.
  const [textValue, setTextValue] = useState<string>("");
  const [subtitlesValue, setSubtitlesValue] = useState<string>("");
  // For Url type, we need a separate state for the actual URL.
  const [urlValue, setUrlValue] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Button/form state.
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  const [createButtonVisible, setCreateButtonVisible] = useState<boolean>(true);
  const [createButtonDisabled, setCreateButtonDisabled] =
    useState<boolean>(false);
  const [createButtonText, setCreateButtonText] = useState<string>("Create");
  const [editButtonVisible, setEditButtonVisible] = useState<boolean>(false);
  const [editButtonDisabled, setEditButtonDisabled] = useState<boolean>(true);
  const [updateButtonVisible, setUpdateButtonVisible] =
    useState<boolean>(false);
  const [updateButtonDisabled, setUpdateButtonDisabled] =
    useState<boolean>(true);
  const [updateButtonText, setUpdateButtonText] = useState<string>("Update");
  const [deleteButtonVisible] = useState<boolean>(true);
  const [deleteButtonDisabled, setDeleteButtonDisabled] =
    useState<boolean>(false);

  // getLabel always returns a fixed label based on localType.
  // For "Url", we want the description label to be "Url Description:".
  const getLabel = () => {
    switch (localType) {
      case "Rich Text":
        return "Rich Text: ";
      case "Code":
        return "Code: ";
      case "Image":
        return "Image Description: ";
      case "Video":
        return "Video Description: ";
      case "Audio":
        return "Audio Description: ";
      case "File":
        return "File Description: ";
      case "Url":
        return "Url Description: ";
      default:
        return "Description: ";
    }
  };

  useEffect(() => {
    if (recordId) {
      // Edit mode: fetch record data from PocketBase.
      const fetchRecord = async () => {
        try {
          const rec = await pb
            .collection("flashcardBackItems")
            .getOne(recordId);
          if (localType === "Code") {
            setTextValue(rec.code || "");
          } else if (localType === "Url") {
            setTextValue(rec.richText || ""); // Description for Url
            setUrlValue(rec.resource || "");
          } else if (localType === "Video") {
            setTextValue(rec.richText || ""); // Description for Video
            setSubtitlesValue(rec.subtitles || "");
          } else {
            setTextValue(rec.richText || "");
          }
          // For file-related types, generate preview or file name.
          if (localType === "Image" && rec.image) {
            // Generate a thumbnail URL.
            const imageUrl = pb.files.getUrl(rec, rec.image, {
              thumb: "0x100",
            });
            setFilePreview(imageUrl);
          } else if (localType === "Video" && rec.video) {
            const videoUrl = pb.files.getUrl(rec, rec.video, {
              thumb: "0x100",
            });
            setFilePreview(videoUrl);
          } else if (localType === "Audio" && rec.audio) {
            setFileName(rec.audioName || rec.audio.split("/").pop());
          } else if (localType === "File" && rec.file) {
            setFileName(rec.fileName || rec.file.split("/").pop());
          }
          // For Url type, we already set urlValue above.
        } catch (err) {
          console.error(err);
          setFormError("Back item record not found.");
        }
      };
      fetchRecord();
      setIsFormEditable(false);
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      setUpdateButtonVisible(true);
      setUpdateButtonDisabled(true);
    } else {
      // Create mode.
      setIsFormEditable(true);
      setCreateButtonVisible(true);
      setCreateButtonDisabled(false);
      setEditButtonVisible(false);
      setUpdateButtonVisible(false);
    }
  }, [recordId, localType]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setFilePreview(URL.createObjectURL(f));
      setFileName(f.name);
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  const handleTextChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setTextValue(e.target.value);
    if (recordId) setUpdateButtonDisabled(false);
  };

  const handleSubtitlesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setSubtitlesValue(e.target.value);
    if (recordId) setUpdateButtonDisabled(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrlValue(e.target.value);
    if (recordId) setUpdateButtonDisabled(false);
  };

  // For Url type, validation checks that at least one of description or URL is provided.
  const isValid = () => {
    if (localType === "Url") {
      return textValue.trim().length > 0 || urlValue.trim().length > 0;
    }
    return (
      textValue.trim().length > 0 ||
      file !== null ||
      filePreview !== null ||
      fileName !== null
    );
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!isValid()) {
      setFormError("Please enter text or select a file.");
      return;
    }
    setCreateButtonDisabled(true);
    try {
      const formData = new FormData();
      formData.append("flashcardFront", flashcardFrontId);
      formData.append("sequential", sequential.toString());
      // Save fields based on type.
      if (localType === "Code") {
        formData.append("code", textValue.trim());
      } else if (localType === "Url") {
        formData.append("richText", textValue.trim()); // Description
        formData.append("resource", urlValue.trim());
      } else if (localType === "Image") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("image", file);
      } else if (localType === "Video") {
        formData.append("richText", textValue.trim());
        formData.append("subtitles", subtitlesValue.trim());
        if (file) formData.append("video", file);
      } else if (localType === "Audio") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("audio", file);
      } else if (localType === "File") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("file", file);
      } else {
        // Rich Text
        formData.append("richText", textValue.trim());
      }
      const record = await pb.collection("flashcardBackItems").create(formData);
      setRecordId(record.id);
      setCreateButtonText("Saved");
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      onItemChanged();
    } catch (err) {
      console.error(err);
      setFormError("Failed to create back item.");
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
    if (!isValid()) {
      setFormError("Please enter text or select a file.");
      setUpdateButtonDisabled(false);
      setIsFormEditable(true);
      return;
    }
    setUpdateButtonDisabled(true);
    setIsFormEditable(false);
    try {
      const formData = new FormData();
      if (localType === "Code") {
        formData.append("code", textValue.trim());
      } else if (localType === "Url") {
        formData.append("richText", textValue.trim());
        formData.append("resource", urlValue.trim());
      } else if (localType === "Image") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("image", file);
      } else if (localType === "Video") {
        formData.append("richText", textValue.trim());
        formData.append("subtitles", subtitlesValue.trim());
        if (file) formData.append("video", file);
      } else if (localType === "Audio") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("audio", file);
      } else if (localType === "File") {
        formData.append("richText", textValue.trim());
        if (file) formData.append("file", file);
      } else {
        formData.append("richText", textValue.trim());
      }
      await pb.collection("flashcardBackItems").update(recordId, formData);
      setUpdateButtonText("updated");
      setEditButtonDisabled(false);
      onItemChanged();
    } catch (err) {
      console.error(err);
      setFormError("Failed to update back item.");
      setUpdateButtonDisabled(false);
      setIsFormEditable(true);
    }
  };

  const handleDelete = async () => {
    setFormError(null);
    setDeleteButtonDisabled(true);
    if (!recordId) {
      onLocalDelete();
      return;
    }
    try {
      await pb.collection("flashcardBackItems").delete(recordId);
      onItemChanged();
    } catch (err) {
      console.error(err);
      setFormError("Failed to delete back item.");
      setDeleteButtonDisabled(false);
    }
  };

  return (
    <div className={styles.listItemContainer}>
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
      <div className={styles.formGroup}>
        <label>{getLabel()}</label>
        <textarea
          value={textValue === "" ? "n/a" : textValue}
          onChange={handleTextChange}
          disabled={!isFormEditable}
          className={styles.textarea}
        />
        {/* For Video subtitles */}
        {localType === "Video" && (
          <>
            <label>Subtitles: </label>
            <textarea
              value={subtitlesValue === "" ? "n/a" : subtitlesValue}
              onChange={handleSubtitlesChange}
              disabled={!isFormEditable}
              className={styles.textarea}
            />
          </>
        )}
        {/* If the item is Url type, render an additional field for the URL */}
        {localType === "Url" && (
          <>
            <label>Url:</label>
            <input
              type="url"
              value={urlValue}
              onChange={handleUrlChange}
              disabled={!isFormEditable}
            />
          </>
        )}
        {/* Render file input (or URL input) only for types that support file input, except Url */}
        {(localType === "Image" ||
          localType === "Video" ||
          localType === "Audio" ||
          localType === "File") && (
          <>
            <input
              type="file"
              accept={
                localType === "Image"
                  ? "image/*"
                  : localType === "Video"
                  ? "video/*"
                  : localType === "Audio"
                  ? "audio/*"
                  : localType === "File"
                  ? "*"
                  : ""
              }
              onChange={handleFileChange}
              disabled={!isFormEditable}
            />
            {/* For Image and Video, display preview */}
            {(localType === "Image" || localType === "Video") &&
              filePreview && (
                <div className={styles.filePreview}>
                  {localType === "Image" && (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className={styles.previewImage}
                    />
                  )}
                  {localType === "Video" && (
                    <video
                      src={filePreview}
                      controls
                      className={styles.previewVideo}
                    />
                  )}
                </div>
              )}
            {/* For Audio and File, display file name */}
            {fileName && (
              <div className={styles.fileName}>
                <p>{fileName}</p>
              </div>
            )}
          </>
        )}
      </div>
      {formError && <p className={styles.errorMessage}>{formError}</p>}
    </div>
  );
};

export default FlashcardBackListItemComponent;
