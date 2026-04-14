const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const exportButton = document.getElementById("exportButton");
const taskList = document.getElementById("taskList");


addButton.addEventListener('click', () => {
  const task = taskInput.value.trim();
  if (task) {
    const li = document.createElement('li');
    li.textContent = task;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Supprimer';
    removeButton.classList.add('remove-btn');
    removeButton.addEventListener('click', () => {
      taskList.removeChild(li);
    });
    li.appendChild(removeButton);

    taskList.appendChild(li);
    taskInput.value = '';
  }
});

function downloadExcel(data, filename) {
  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tâches');

  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

exportButton.addEventListener('click', () => {
  const taskItems = Array.from(taskList.querySelectorAll('li'));
  if (!taskItems.length) {
    alert('Aucune tâche à exporter en Excel.');
    return;
  }

  const data = [
    ['Tâche de la todo list Excel'],
    ...taskItems.map(li => [li.firstChild.textContent || ''])
  ];

  downloadExcel(data, 'todo.xlsx');
});