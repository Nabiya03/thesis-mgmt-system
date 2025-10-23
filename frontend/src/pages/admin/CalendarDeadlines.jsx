import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, Building, FileText , Edit} from "lucide-react";
import { updateDeadline} from '../../api/userService';
const submissionLabels = {
  1: "Draft Proposal",
  2: "Presentation",
  3: "Thesis"
};



export default function CalendarDeadlines({ calendars, fetchCalendars }) {
  const [showPast, setShowPast] = useState(false);
  const now = new Date();
   const [editingDeadline, setEditingDeadline] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (calendar, deadline) => {
    setEditingDeadline({ ...deadline, department: calendar.department });
    setNewDate(deadline.deadline.slice(0, 16)); // prefill in local datetime format
    setShowModal(true);
  };

  const toUTCString = (date) => {
  if (!date) return null;
  const utcDate = new Date(date + "T23:59:59Z");
  return utcDate.toISOString();
};

  const saveDeadline = async () => {
    if (new Date(newDate) < new Date()) {
      alert("Deadline cannot be in the past!");
      return;
    }
      const payload = {
    department: editingDeadline.department,
    submissionNumber: editingDeadline.submissionNumber,
    deadline: toUTCString(newDate.split("T")[0]) // keep same UTC conversion
  };
     try {
        console.log("sending update dealdine data", payload);
    const res = await updateDeadline(payload); // using your API helper

    if (res.data?.success) {
     fetchCalendars();// refresh from parent
      setShowModal(false);
    } else {
      alert(res.data?.message || "Failed to update deadline");
    }
  } catch (error) {
    console.error(error);
    alert("Something went wrong while updating the deadline.");
  }
  };

  // Flatten, sort, and group deadlines by date
  const groupedDeadlines = useMemo(() => {
    const flatList = calendars.flatMap(calendar =>
      calendar.deadlines.map(d => ({
        ...d,
        department: calendar.department
      }))
    );

    const sorted = flatList.sort(
      (a, b) => new Date(a.deadline) - new Date(b.deadline)
    );

    const filtered = sorted.filter(d =>
      showPast ? new Date(d.deadline) <= now : new Date(d.deadline) > now
    );

    // Group by deadline date (YYYY-MM-DD)
    return filtered.reduce((groups, item) => {
      const dateKey = new Date(item.deadline).toISOString().split("T")[0];
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(item);
      return groups;
    }, {});
  }, [calendars, showPast, now]);

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {showPast ? "Past Deadlines" : "Upcoming Deadlines"}
          </h2>
          <button
            onClick={() => setShowPast(!showPast)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            {showPast ? "Show Upcoming" : "Show Past"}
          </button>
        </div>

        {Object.keys(groupedDeadlines).length === 0 ? (
          <p className="text-gray-500">
            No {showPast ? "past" : "upcoming"} deadlines.
          </p>
        ) : (
          Object.entries(groupedDeadlines).map(([dateKey, deadlines]) => (
            <div key={dateKey} className="mb-6">
              {/* Date Header */}
              <div className="flex items-center space-x-2 mb-3">
                <CalendarIcon className="h-5 w-5 text-blue-500" />
                <h3 className="text-md font-semibold text-gray-800">
                  {new Date(dateKey).toLocaleDateString(undefined, {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric"
                  })}
                </h3>
              </div>

              {/* Deadline Cards */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                
                {deadlines.map(deadline => (
                  <div
                    key={deadline._id}
                    className="border rounded-lg p-4 bg-blue-50 hover:shadow-md transition"
                  >
                    
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-600" />
                      <span className="font-medium text-gray-800">
                        {submissionLabels[deadline.submissionNumber] ||
                          `Submission ${deadline.submissionNumber}`}
                      </span>

                        {/* Edit Icon */}
  <button
    onClick={() => handleEdit({ department: deadline.department }, deadline)}
    className="p-1 rounded hover:bg-gray-200 align-sub"
    title="Edit deadline"
  >
    <Edit className="h-4 w-4 text-gray-500" />
  </button>
                      
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Building className="h-4 w-4" />
                      <span>{deadline.department}</span>

                      
                    </div>
                    
                    <div>
                        
                    </div>
                  </div>

                  
                ))}
              </div>
            </div>
          ))
        )}
      </div>
      {showModal && editingDeadline && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Edit Deadline
      </h3>

      {/* Department */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Department</label>
        <input
          type="text"
          value={editingDeadline.department}
          readOnly
          className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100"
        />
      </div>

      {/* Submission */}
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700">Submission</label>
        <input
          type="text"
          value={submissionLabels[editingDeadline.submissionNumber] || `Submission ${editingDeadline.submissionNumber}`}
          readOnly
          className="mt-1 block w-full border border-gray-300 rounded-md bg-gray-100"
        />
      </div>

      {/* Date Picker */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">Deadline Date</label>
        <input
          type="datetime-local"
          min={new Date().toISOString()}
          value={newDate}
          onChange={(e) => setNewDate(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={() => setShowModal(false)}
          className="px-4 py-2 border border-gray-300 rounded-md bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={saveDeadline}
          className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
)}

    </div>

    
  );
}
