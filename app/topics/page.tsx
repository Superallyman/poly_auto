"use client";
import { useState, useEffect } from "react";
import { useUserData } from "@/hooks/useUserData";
import Tiptap from "@/components/TextEditor/TipTap";

interface Topic {
  topic_id: number;
  topic_name: string;
  topic_content: string;
  is_archived: boolean;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export default function TopicsPage() {
  const { data, loading, error, refetch } = useUserData();
  const [topicName, setTopicName] = useState<string>("");
  const [topicContent, setTopicContent] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);

  useEffect(() => {
    if (message && message.includes("successfully")) {
      const timer = setTimeout(() => {
        setMessage("");
      }, 5000); // 5000 milliseconds = 5 seconds
      return () => clearTimeout(timer); // Cleanup the timer
    }
  }, [message]);

  // Clear form function
  const clearForm = () => {
    setTopicName("");
    setTopicContent("");
    setEditingTopic(null);
  };

  // Get auth token from localStorage (same pattern as useUserData)
  const getAuthToken = () => {
    const authToken = localStorage.getItem('sb-klkgjmdmoonuqwlnqvpm-auth-token');
    if (!authToken) return null;
    try {
      const tokenData = JSON.parse(authToken);
      return tokenData.access_token;
    } catch {
      return null;
    }
  };

  // Handle form submission for creating/updating topics
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topicName.trim() || !topicContent.trim()) {
      setMessage("Please fill in both fields");
      return;
    }
    
    setIsSubmitting(true);
    setMessage("");
    
    try {
      const accessToken = getAuthToken();
      if (!accessToken) {
        setMessage("Authentication failed. Please log in again.");
        return;
      }
      
      const url = editingTopic ? "/api/userData/topics" : "/api/userData";
      const method = editingTopic ? "PUT" : "POST";
      
      const requestBody = editingTopic
        ? {
            topic_id: editingTopic.topic_id,
            topic_name: topicName.trim(),
            topic_content: topicContent.trim(),
          }
        : {
            topic_name: topicName.trim(),
            topic_content: topicContent.trim(),
          };
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(editingTopic ? "Topic updated successfully!" : "Topic added successfully!");
        clearForm();
        refetch(); // Use the refetch from useUserData hook
      } else {
        setMessage(data.message || `Failed to ${editingTopic ? 'update' : 'add'} topic`);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setMessage("Network error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle archive/unarchive
  const handleArchiveToggle = async (topic: Topic) => {
    try {
      const accessToken = getAuthToken();
      if (!accessToken) {
        setMessage("Authentication failed. Please log in again.");
        return;
      }

      const response = await fetch("/api/userData/topics", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          topic_id: topic.topic_id,
          is_archived: !topic.is_archived,
        }),
      });

      if (response.ok) {
        setMessage(`Topic ${topic.is_archived ? 'unarchived' : 'archived'} successfully!`);
        refetch(); // Use the refetch from useUserData hook
      } else {
        const errorData = await response.json();
        setMessage(errorData.message || "Failed to update topic");
      }
    } catch (error) {
      console.error("Archive toggle error:", error);
      setMessage("Network error occurred");
    }
  };

// Handle edit topic
const handleEditTopic = (topic: Topic) => {
  setEditingTopic(topic);
  setTopicName(topic.topic_name);
  
  // A two-step process to ensure the Tiptap component resets properly.
  // First, set the content to an empty string to clear the editor's state.
  setTopicContent(""); 
  
  // Then, on the next render, set the actual topic content.
  // This is a more robust way to handle state changes with external libraries
  // that manage their own DOM.
  setTimeout(() => {
    setTopicContent(topic.topic_content);
  }, 0); 
  
  // Scroll to form
  document.getElementById('topic-form')?.scrollIntoView({ behavior: 'smooth' });
};


  // Handle loading and error states
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading topics...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-100 dark:bg-red-200 text-red-700 p-4 rounded">
          Error loading topics: {error}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          Please log in to view your topics.
        </div>
      </div>
    );
  }

  // Get topics from the data (they're in data.topics array)
  const topics: Topic[] = data.topics || [];
  
  // Filter topics based on archived status
  const filteredTopics = topics.filter(topic => showArchived ? topic.is_archived : !topic.is_archived);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">My Topics</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-2 rounded-md transition-colors ${
              showArchived
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {showArchived ? 'Show Active' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Add/Edit Topic Form */}
      <div id="topic-form" className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {editingTopic ? 'Edit Topic' : 'Add New Topic'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="topicName"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Topic Name
            </label>
            <input
              type="text"
              id="topicName"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter topic name"
              disabled={isSubmitting}
            />
          </div>
          <div>
            <label
              htmlFor="topicContent"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Topic Content
            </label>
            <div className="rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2">
              <Tiptap 
                initialText={topicContent} 
                setText={setTopicContent}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting 
                ? (editingTopic ? "Updating Topic..." : "Adding Topic...") 
                : (editingTopic ? "Update Topic" : "Add Topic")
              }
            </button>
            {editingTopic && (
              <button
                type="button"
                onClick={clearForm}
                className="bg-gray-600 text-white py-2 px-4 rounded hover:bg-gray-700"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
        {message && (
          <div
            className={`mt-4 p-3 rounded text-sm ${
              message.includes("successfully")
                ? "bg-green-100 dark:bg-green-200 text-green-700"
                : "bg-red-100 dark:bg-red-200 text-red-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      {/* Topics List */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          {showArchived ? 'Archived Topics' : 'Active Topics'} ({filteredTopics.length})
        </h2>
        
        {filteredTopics.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            {showArchived 
              ? "No archived topics found." 
              : "No active topics found. Create your first topic above!"
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTopics.map((topic) => (
              <div
                key={topic.topic_id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {topic.topic_name}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleArchiveToggle(topic)}
                      className={`text-sm ${
                        topic.is_archived
                          ? 'text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300'
                          : 'text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300'
                      }`}
                    >
                      {topic.is_archived ? 'Unarchive' : 'Archive'}
                    </button>
                  </div>
                </div>
                <div 
                  className="text-gray-700 dark:text-gray-300  max-w-none"
                  dangerouslySetInnerHTML={{ __html: topic.topic_content }}
                />
                {topic.is_archived && (
                  <div className="mt-2 inline-block px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-xs rounded">
                    Archived
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}