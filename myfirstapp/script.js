const taskInput = document.getElementById("taskInput");
const addButton = document.getElementById("addButton");
const taskList = document.getElementById("taskList");


addButton.addEventListener('click', () => {
  const task = taskInput.value.trim();
  if (task) {
    const li = document.createElement('li');
    li.textContent = task;
    
    // Create and append a remove button
    const removeButton = document.createElement('button');
    removeButton.textContent = 'Supprimer';
    removeButton.classList.add('remove-btn');  // Add class for styling
    removeButton.addEventListener('click', () => {
      taskList.removeChild(li);
    });
    li.appendChild(removeButton);
    
    taskList.appendChild(li);
    taskInput.value = '';
  }
});