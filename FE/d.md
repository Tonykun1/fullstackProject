{isEditing ? (
                <div>
                    <ReactQuill
                        value={editContent}
                        onChange={setEditContent}
                        className="mb-2"
                    />
                    <div className="d-flex ">
                        <button
                            onClick={handleEditSave}
                            className="btn btn-outline-primary mr-2"
                        >
                            Save
                        </button>
                        <button
                            onClick={() => setIsEditing(false)}
                            className="btn btn-outline-danger"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div>
                    <div className="d-flex">
                        {(comment.username === currentUser?.username || currentUser?.role === 'admin') && (
                            <div >
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-outline-primary mt-2"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => onDelete(comment.id)}
                                    className="btn btn-outline-danger mt-2"
                                >
                                    Delete
                                </button>
                            </div>
                        )}
                        <button
                            onClick={() => setShowReply(!showReply)}
                            className={`btn ${
                                showReply
                                    ? "btn btn-outline-danger"
                                    : "btn btn-outline-success"
                            } mt-2`}
                        >
                            {showReply ? "Cancel Reply" : "Reply"}
                        </button>
                    </div>
                </div>
            )}
            </div>