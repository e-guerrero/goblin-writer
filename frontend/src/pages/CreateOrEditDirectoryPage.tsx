// CreateOrEditDirectoryPage.tsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { pb } from "../lib/pocketbase";
// import { RecordModel } from "pocketbase";

const CreateOrEditDirectoryPage: React.FC = () => {
  // URL params:
  // - parentId: id of the parent directory where this record will be stored.
  //   If undefined, the record is stored in root (represented as an empty string).
  // - id: the id of the record to view/edit. If absent, we are in create mode.
  const { parentId, id } = useParams<{ parentId?: string; id?: string }>();
  const navigate = useNavigate();

  // We'll store the record id in state.
  // In create mode this starts off undefined; in edit mode we initialize it from the route.
  const [recordId, setRecordId] = useState<string | undefined>(id);

  // ---------------------------------------------------------------------
  // FORM FIELD STATES (for PocketBase record attributes)
  // ---------------------------------------------------------------------
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  // For media, we assume the record’s fields are files.
  // (PocketBase expects File objects for file-type fields.)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  // ---------------------------------------------------------------------
  // BUTTON/FORM STATE VARIABLES
  // ---------------------------------------------------------------------
  // Controls whether the input controls are enabled (editable) or not.
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  // Error message to display, if any.
  const [formError, setFormError] = useState<string | null>(null);

  // For create mode:
  const [createButtonVisible, setCreateButtonVisible] =
    useState<boolean>(false);
  const [createButtonDisabled, setCreateButtonDisabled] =
    useState<boolean>(true);
  const [createButtonText, setCreateButtonText] = useState<string>("Create");

  // For edit mode:
  const [editButtonVisible, setEditButtonVisible] = useState<boolean>(false);
  const [editButtonDisabled, setEditButtonDisabled] = useState<boolean>(true);
  const [updateButtonVisible, setUpdateButtonVisible] =
    useState<boolean>(false);
  const [updateButtonDisabled, setUpdateButtonDisabled] =
    useState<boolean>(true);
  const [updateButtonText, setUpdateButtonText] = useState<string>("Update");

  // ---------------------------------------------------------------------
  // INITIAL SETUP: after first load, the action buttons are all hidden
  // and disabled and the input controls are visible but disabled.
  // Then we “unlock” the form based on whether we’re creating or editing.
  // ---------------------------------------------------------------------
  useEffect(() => {
    if (recordId) {
      // EDIT MODE: record exists.
      // (Fetch the record so we can prepopulate the input fields.)
      const fetchRecord = async () => {
        try {
          const record = await pb.collection("directories").getOne(recordId);
          setName(record.name);
          setDescription(record.richText || "");
          // (If your record returns URLs for image/video, you could set previews here.)
        } catch (err) {
          console.error(err);
          setFormError("Record not found.");
        }
      };
      fetchRecord();
      // In edit mode the inputs are initially locked (read-only).
      setIsFormEditable(false);
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      // The update button is rendered but remains disabled until “Edit” is pressed.
      setUpdateButtonVisible(true);
      setUpdateButtonDisabled(true);
      // The create button is not used.
      setCreateButtonVisible(false);
    } else {
      // CREATE MODE: no record exists yet.
      // Enable the form immediately so the user can type in data.
      setIsFormEditable(true);
      setCreateButtonVisible(true);
      setCreateButtonDisabled(false);
      // No edit or update buttons.
      setEditButtonVisible(false);
      setUpdateButtonVisible(false);
    }
  }, [recordId]);

  // ---------------------------------------------------------------------
  // HANDLERS FOR FILE INPUT CHANGES (for image & video)
  // ---------------------------------------------------------------------
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      // In edit mode, if a change is made, enable the update button.
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      if (recordId) setUpdateButtonDisabled(false);
    }
  };

  // A helper for text inputs that also re-enables the update button in edit mode.
  const handleInputChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setter(e.target.value);
      if (recordId) {
        // In edit mode, if the user changes something, allow update.
        setUpdateButtonDisabled(false);
      }
    };

  // ---------------------------------------------------------------------
  // HANDLERS FOR ACTION BUTTON CLICKS
  // ---------------------------------------------------------------------

  // Back button handler navigates to /directories/:parentId? (empty string represents root)
  const handleBack = () => {
    navigate(`/directories/${parentId === undefined ? "" : parentId}`);
  };

  // CREATE BUTTON handler (for create mode)
  const handleCreate = async () => {
    setFormError(null);
    setCreateButtonDisabled(true);
    if (!name.trim()) {
      setFormError("Name is required.");
      setCreateButtonDisabled(false);
      return;
    }
    try {
      // Build a FormData object so that file uploads are supported.
      const formData = new FormData();
      formData.append("name", name.trim());
      formData.append("richText", description);
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }
      // Use an empty string for the parent if parentId is undefined.
      if (parentId != undefined) {
        formData.append("parentDirectory", parentId);
      }

      formData.append("user", pb.authStore.record!.id);

      // Create the record in PocketBase.
      const record = await pb.collection("directories").create(formData);
      // Set the new record id so we’re now in edit mode.
      setRecordId(record.id);
      // Change the create button text to “Saved”.
      setCreateButtonText("Saved");
      // Also, show the Edit button (and hide the create button).
      setEditButtonVisible(true);
      setEditButtonDisabled(false);
      setCreateButtonVisible(false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to create the record." + err);
      setCreateButtonDisabled(false);
    }
  };

  // EDIT BUTTON handler (for switching an existing record into editing mode)
  const handleEdit = () => {
    // Disable the edit button so that the user cannot click it twice.
    setEditButtonDisabled(true);
    // Enable the form controls.
    setIsFormEditable(true);
    // Show the update button (set text to "Update") and enable it.
    setUpdateButtonText("Update");
    setUpdateButtonVisible(true);
    setUpdateButtonDisabled(false);
  };

  // UPDATE BUTTON handler (for updating an existing record)
  const handleUpdate = async () => {
    setFormError(null);
    setUpdateButtonDisabled(true);
    // Lock the form while updating.
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
      formData.append("richText", description);
      if (imageFile) {
        formData.append("image", imageFile);
      }
      if (videoFile) {
        formData.append("video", videoFile);
      }
      // In edit mode the parent is not being changed.
      await pb.collection("directories").update(recordId!, formData);
      // On success, change the update button text to “updated”
      setUpdateButtonText("updated");
      // Re-enable the Edit button so the user can re-enable editing later.
      setEditButtonDisabled(false);
    } catch (err) {
      console.error(err);
      setFormError("Failed to update the record.");
      setUpdateButtonDisabled(false);
      // Allow the user to try updating again.
      setIsFormEditable(true);
    }
  };

  // ---------------------------------------------------------------------
  // RENDER: first display a Back button and a title.
  // Then show the input controls for the record attributes.
  // Finally, conditionally render the action buttons.
  // ---------------------------------------------------------------------
  return (
    <div className="create-edit-directory-page">
      {/* Back Button */}
      <button onClick={handleBack}>Back</button>
      <h2>{recordId ? "Edit Directory" : "Create Directory"}</h2>

      {/* Display any error message */}
      {formError && <p className="error-message">{formError}</p>}

      <form onSubmit={(e) => e.preventDefault()}>
        {/* Name input (mandatory) */}
        <div className="form-group">
          <label htmlFor="name">Name (required):</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={handleInputChange(setName)}
            disabled={!isFormEditable}
          />
        </div>

        {/* Description input (optional) */}
        <div className="form-group">
          <label htmlFor="description">Description (optional):</label>
          <textarea
            id="description"
            value={description}
            onChange={handleInputChange(setDescription)}
            disabled={!isFormEditable}
          />
        </div>

        {/* Image input */}
        <div className="form-group">
          <label htmlFor="image">Image (optional):</label>
          <input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={!isFormEditable}
          />
          {imagePreview && (
            <div>
              <p>Image Preview:</p>
              <img
                src={imagePreview}
                alt="Preview"
                style={{ maxWidth: "200px" }}
              />
            </div>
          )}
        </div>

        {/* Video input */}
        <div className="form-group">
          <label htmlFor="video">Video (optional):</label>
          <input
            id="video"
            type="file"
            accept="video/*"
            onChange={handleVideoChange}
            disabled={!isFormEditable}
          />
          {videoPreview && (
            <div>
              <p>Video Preview:</p>
              <video
                src={videoPreview}
                controls
                style={{ maxWidth: "200px" }}
              />
            </div>
          )}
        </div>
      </form>

      {/* ---------------------------------------------------------------------
          ACTION BUTTONS
          In create mode (recordId is undefined):
            – Only the Create/Saved button is visible and enabled.
          In edit mode (recordId exists):
            – The Edit button is visible and enabled (when not editing).
            – When Edit is clicked, the Update button appears and is enabled.
          --------------------------------------------------------------------- */}
      <div className="action-buttons">
        {/* Create/Saved button (only in create mode) */}
        {!recordId && createButtonVisible && (
          <button onClick={handleCreate} disabled={createButtonDisabled}>
            {createButtonText}
          </button>
        )}

        {/* In edit mode, show the Edit button */}
        {recordId && editButtonVisible && (
          <button onClick={handleEdit} disabled={editButtonDisabled}>
            Edit
          </button>
        )}

        {/* In edit mode, show the Update/Updated button if visible */}
        {recordId && updateButtonVisible && (
          <button onClick={handleUpdate} disabled={updateButtonDisabled}>
            {updateButtonText}
          </button>
        )}
      </div>
    </div>
  );
};

export default CreateOrEditDirectoryPage;
