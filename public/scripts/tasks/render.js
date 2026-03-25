import {
    taskGroupsState,
    getTodayDateString,
    getTasksDueTodayFromState,
    formatTaskDueDateForDisplay
} from './data.js';

export const taskPageElements = {
    addGroupButton: null,
    toggleDueTodayButton: null,
    toggleGroupsButton: null,
    dueTodayPanel: null,
    groupsPanel: null,
    dueTodayToggleIcon: null,
    groupsToggleIcon: null,
    entityModal: null,
    modalBackdrop: null,
    entityForm: null,
    modalCancelButton: null,
    modalTitle: null,
    modalDescription: null,
    modalFieldsContainer: null,
    modalSubmitButton: null,
    groupCardsContainer: null,
    dueTodayList: null,
    dueTodaySummary: null
};

export const tasksModalContext = {
    activeEntityType: null,
    parentGroupId: null,
    parentSubgroupId: null,
    renameTaskId: null
};

export function cachetaskPageElements() {
    taskPageElements.addGroupButton = document.getElementById('addGroupBtn');
    taskPageElements.toggleDueTodayButton = document.getElementById('toggleDueTodayBtn');
    taskPageElements.toggleGroupsButton = document.getElementById('toggleGroupsBtn');
    taskPageElements.dueTodayPanel = document.querySelector('.tasks-due-today');
    taskPageElements.groupsPanel = document.querySelector('.tasks-main');
    taskPageElements.dueTodayToggleIcon = document.getElementById('dueTodayToggleIcon');
    taskPageElements.groupsToggleIcon = document.getElementById('groupsToggleIcon');
    taskPageElements.entityModal = document.getElementById('entityModal');
    taskPageElements.modalBackdrop = document.getElementById('modalBackdrop');
    taskPageElements.entityForm = document.getElementById('entityForm');
    taskPageElements.modalCancelButton = document.getElementById('modalCancel');
    taskPageElements.modalTitle = document.getElementById('modalTitle');
    taskPageElements.modalDescription = document.getElementById('modalDesc');
    taskPageElements.modalFieldsContainer = document.getElementById('modalFields');
    taskPageElements.modalSubmitButton = document.getElementById('modalSubmit');
    taskPageElements.groupCardsContainer = document.getElementById('taskGroups');
    taskPageElements.dueTodayList = document.querySelector('.due-today-list');
    taskPageElements.dueTodaySummary = document.querySelector('.due-today-more');
}

export function openGroupModal() {
    tasksModalContext.activeEntityType = 'group';
    tasksModalContext.parentGroupId = null;
    tasksModalContext.parentSubgroupId = null;
    tasksModalContext.renameTaskId = null;

    if (
        !taskPageElements.entityModal ||
        !taskPageElements.modalFieldsContainer ||
        !taskPageElements.modalTitle ||
        !taskPageElements.modalDescription ||
        !taskPageElements.modalSubmitButton
    ) return;

    taskPageElements.modalTitle.textContent = 'Add Group';
    taskPageElements.modalDescription.textContent = 'Name your new group.';
    taskPageElements.modalSubmitButton.textContent = 'Add group';

    taskPageElements.modalFieldsContainer.innerHTML =
        '<label for="groupName">Group name</label>' +
        '<input type="text" id="groupName" name="groupName" required ' +
        'placeholder="e.g. Chores" autocomplete="off" maxlength="100">';

    taskPageElements.entityModal.hidden = false;
    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'true');
    }

    const groupNameInputElement = document.getElementById('groupName');
    if (groupNameInputElement) groupNameInputElement.focus();

    document.body.style.overflow = 'hidden';
}

export function openSubgroupModal(parentGroupId, parentGroupName) {
    tasksModalContext.activeEntityType = 'subgroup';
    tasksModalContext.parentGroupId = parentGroupId;
    tasksModalContext.parentSubgroupId = null;
    tasksModalContext.renameTaskId = null;

    if (
        !taskPageElements.entityModal ||
        !taskPageElements.modalFieldsContainer ||
        !taskPageElements.modalTitle ||
        !taskPageElements.modalDescription ||
        !taskPageElements.modalSubmitButton
    ) return;

    taskPageElements.modalTitle.textContent = 'Add Subgroup';
    taskPageElements.modalDescription.textContent = 'Name a subgroup for "' + parentGroupName + '".';
    taskPageElements.modalSubmitButton.textContent = 'Add subgroup';

    taskPageElements.modalFieldsContainer.innerHTML =
        '<label for="subgroupName">Subgroup name</label>' +
        '<input type="text" id="subgroupName" name="subgroupName" required ' +
        'placeholder="e.g. Kitchen" autocomplete="off" maxlength="100">';

    taskPageElements.entityModal.hidden = false;
    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'true');
    }

    const subgroupNameInputElement = document.getElementById('subgroupName');
    if (subgroupNameInputElement) subgroupNameInputElement.focus();

    document.body.style.overflow = 'hidden';
}

export function openTaskModal(parentGroupId, parentSubgroupId, parentSubgroupName) {
    tasksModalContext.activeEntityType = 'task';
    tasksModalContext.parentGroupId = parentGroupId;
    tasksModalContext.parentSubgroupId = parentSubgroupId;
    tasksModalContext.renameTaskId = null;

    if (
        !taskPageElements.entityModal ||
        !taskPageElements.modalFieldsContainer ||
        !taskPageElements.modalTitle ||
        !taskPageElements.modalDescription ||
        !taskPageElements.modalSubmitButton
    ) return;

    taskPageElements.modalTitle.textContent = 'Add Task';
    taskPageElements.modalDescription.textContent = 'Add a task for "' + parentSubgroupName + '".';
    taskPageElements.modalSubmitButton.textContent = 'Add task';

    const todayDateString = getTodayDateString();

    taskPageElements.modalFieldsContainer.innerHTML =
        '<label for="taskTitle">Task name</label>' +
        '<input type="text" id="taskTitle" name="taskTitle" required ' +
        'placeholder="Task title" autocomplete="off" maxlength="200">' +
        '<label for="taskDueDate">Due date</label>' +
        '<input type="date" id="taskDueDate" name="taskDueDate" required value="' + todayDateString + '">';

    taskPageElements.entityModal.hidden = false;
    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'true');
    }

    const taskTitleInputElement = document.getElementById('taskTitle');
    if (taskTitleInputElement) taskTitleInputElement.focus();

    document.body.style.overflow = 'hidden';
}

export function openRenameTaskModal(taskId, taskTitle, taskDueDate) {
    tasksModalContext.activeEntityType = 'rename-task';
    tasksModalContext.renameTaskId = taskId;
    tasksModalContext.parentGroupId = null;
    tasksModalContext.parentSubgroupId = null;

    if (
        !taskPageElements.entityModal ||
        !taskPageElements.modalFieldsContainer ||
        !taskPageElements.modalTitle ||
        !taskPageElements.modalDescription ||
        !taskPageElements.modalSubmitButton
    ) return;

    taskPageElements.modalTitle.textContent = 'Rename task';
    taskPageElements.modalDescription.textContent = 'Update the name and due date for this task.';
    taskPageElements.modalSubmitButton.textContent = 'Save';

    taskPageElements.modalFieldsContainer.innerHTML =
        '<label for="taskTitle">Task name</label>' +
        '<input type="text" id="taskTitle" name="taskTitle" required ' +
        'placeholder="Task title" autocomplete="off" maxlength="200">' +
        '<label for="taskDueDate">Due date</label>' +
        '<input type="date" id="taskDueDate" name="taskDueDate" required>';

    const taskTitleInputAfter = document.getElementById('taskTitle');
    const taskDueDateInputAfter = document.getElementById('taskDueDate');
    if (taskTitleInputAfter) taskTitleInputAfter.value = taskTitle || '';
    if (taskDueDateInputAfter) taskDueDateInputAfter.value = taskDueDate || '';

    taskPageElements.entityModal.hidden = false;
    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'true');
    }

    if (taskTitleInputAfter) {
        taskTitleInputAfter.focus();
        taskTitleInputAfter.select();
    }

    document.body.style.overflow = 'hidden';
}

export function closeTasksModal() {
    if (!taskPageElements.entityModal) return;

    taskPageElements.entityModal.hidden = true;
    tasksModalContext.activeEntityType = null;
    tasksModalContext.parentGroupId = null;
    tasksModalContext.parentSubgroupId = null;
    tasksModalContext.renameTaskId = null;

    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'false');
    }
    if (taskPageElements.entityForm) {
        taskPageElements.entityForm.reset();
    }

    document.body.style.overflow = '';
}

function createTaskCompleteButton(taskId) {
    const completeButtonElement = document.createElement('button');
    completeButtonElement.type = 'button';
    completeButtonElement.className = 'task-complete-btn';
    completeButtonElement.setAttribute('data-action', 'complete-task');
    completeButtonElement.setAttribute('data-task-id', taskId);
    completeButtonElement.setAttribute('aria-label', 'Mark task complete');

    const visualWrapElement = document.createElement('span');
    visualWrapElement.className = 'task-complete-visual';
    visualWrapElement.setAttribute('aria-hidden', 'true');

    const boxElement = document.createElement('span');
    boxElement.className = 'task-complete-box';

    const checkIconElement = document.createElement('img');
    checkIconElement.className = 'task-complete-check';
    checkIconElement.src = 'styles/images/icons/checkMark.svg';
    checkIconElement.alt = '';

    visualWrapElement.appendChild(boxElement);
    visualWrapElement.appendChild(checkIconElement);
    completeButtonElement.appendChild(visualWrapElement);
    return completeButtonElement;
}

function createTaskMenuWrap(task) {
    const menuWrapElement = document.createElement('div');
    menuWrapElement.className = 'task-row-menu-wrap';

    const menuToggleButtonElement = document.createElement('button');
    menuToggleButtonElement.type = 'button';
    menuToggleButtonElement.className = 'task-menu-btn';
    menuToggleButtonElement.setAttribute('data-action', 'task-menu-toggle');
    menuToggleButtonElement.setAttribute('data-task-id', task.id);
    menuToggleButtonElement.setAttribute('aria-label', 'Task options');
    menuToggleButtonElement.setAttribute('aria-expanded', 'false');
    menuToggleButtonElement.setAttribute('aria-haspopup', 'true');

    const menuIconElement = document.createElement('img');
    menuIconElement.src = 'styles/images/icons/menu.svg';
    menuIconElement.alt = '';
    menuIconElement.setAttribute('aria-hidden', 'true');
    menuToggleButtonElement.appendChild(menuIconElement);

    const menuDropdownElement = document.createElement('div');
    menuDropdownElement.className = 'task-action-menu';
    menuDropdownElement.hidden = true;
    menuDropdownElement.setAttribute('role', 'menu');

    const renameMenuItemElement = document.createElement('button');
    renameMenuItemElement.type = 'button';
    renameMenuItemElement.className = 'task-action-menu-item';
    renameMenuItemElement.setAttribute('data-action', 'rename-task');
    renameMenuItemElement.setAttribute('data-task-id', task.id);
    renameMenuItemElement.setAttribute('role', 'menuitem');
    renameMenuItemElement.textContent = 'Rename';

    const deleteMenuItemElement = document.createElement('button');
    deleteMenuItemElement.type = 'button';
    deleteMenuItemElement.className = 'task-action-menu-item task-action-menu-item--danger';
    deleteMenuItemElement.setAttribute('data-action', 'delete-task');
    deleteMenuItemElement.setAttribute('data-task-id', task.id);
    deleteMenuItemElement.setAttribute('role', 'menuitem');
    deleteMenuItemElement.textContent = 'Delete';

    menuDropdownElement.appendChild(renameMenuItemElement);
    menuDropdownElement.appendChild(deleteMenuItemElement);
    menuWrapElement.appendChild(menuToggleButtonElement);
    menuWrapElement.appendChild(menuDropdownElement);
    return menuWrapElement;
}

export function renderTasksDueTodayPanel() {
    if (!taskPageElements.dueTodayList) return;

    const tasksDueToday = getTasksDueTodayFromState();
    taskPageElements.dueTodayList.textContent = '';

    tasksDueToday.forEach(function (task) {
        const listItemElement = document.createElement('li');
        const rowElement = document.createElement('div');
        rowElement.className = 'due-today-item';

        rowElement.appendChild(createTaskCompleteButton(task.id));

        const titleElement = document.createElement('span');
        titleElement.className = 'task-row-title';
        titleElement.textContent = task.title;

        rowElement.appendChild(titleElement);
        rowElement.appendChild(createTaskMenuWrap(task));

        listItemElement.appendChild(rowElement);
        taskPageElements.dueTodayList.appendChild(listItemElement);
    });

    if (!taskPageElements.dueTodaySummary) return;

    if (tasksDueToday.length > 0) {
        taskPageElements.dueTodaySummary.hidden = false;
        taskPageElements.dueTodaySummary.textContent = '';
    } else {
        taskPageElements.dueTodaySummary.hidden = true;
    }
}

export function renderTaskGroups() {
    if (!taskPageElements.groupCardsContainer) return;

    taskPageElements.groupCardsContainer.textContent = '';

    taskGroupsState.forEach(function (group) {
        const groupCardElement = document.createElement('div');
        groupCardElement.className = 'task-group';
        groupCardElement.setAttribute('data-group-id', group.id);

        const groupHeaderElement = document.createElement('div');
        groupHeaderElement.className = 'task-group-header';

        const groupTitleElement = document.createElement('h3');
        groupTitleElement.className = 'task-group-title';
        groupTitleElement.textContent = group.name;

        const addSubgroupButtonElement = document.createElement('button');
        addSubgroupButtonElement.type = 'button';
        addSubgroupButtonElement.className = 'add-subgroup-btn';
        addSubgroupButtonElement.textContent = '+ Subgroup';
        addSubgroupButtonElement.setAttribute('data-action', 'add-subgroup');
        addSubgroupButtonElement.setAttribute('data-group-id', group.id);

        const groupControlsElement = document.createElement('div');
        groupControlsElement.className = 'task-group-controls';

        const groupToggleButtonElement = document.createElement('button');
        groupToggleButtonElement.type = 'button';
        groupToggleButtonElement.className = 'group-toggle-btn panel-toggle-btn';
        groupToggleButtonElement.setAttribute('data-action', 'toggle-group-collapse');
        groupToggleButtonElement.setAttribute('data-group-id', group.id);
        groupToggleButtonElement.setAttribute('aria-label', 'Collapse group');

        const groupToggleIconElement = document.createElement('img');
        groupToggleIconElement.className = 'group-toggle-icon';
        groupToggleIconElement.setAttribute('data-group-toggle-icon-for', group.id);
        groupToggleIconElement.src = 'styles/images/icons/collapse content.svg';
        groupToggleIconElement.alt = '';

        groupToggleButtonElement.appendChild(groupToggleIconElement);

        groupControlsElement.appendChild(addSubgroupButtonElement);
        groupControlsElement.appendChild(groupToggleButtonElement);

        groupHeaderElement.appendChild(groupTitleElement);
        groupHeaderElement.appendChild(groupControlsElement);

        const subgroupListElement = document.createElement('ul');
        subgroupListElement.className = 'task-group-list';
        subgroupListElement.setAttribute('aria-label', 'Subgroups in ' + group.name);

        group.subgroups.forEach(function (subgroup) {
            const subgroupListItem = document.createElement('li');
            subgroupListItem.className = 'subgroup';
            subgroupListItem.setAttribute('data-subgroup-id', subgroup.id);

            const subgroupPillButton = document.createElement('button');
            subgroupPillButton.type = 'button';
            subgroupPillButton.className = 'subgroup-pill';
            subgroupPillButton.setAttribute('data-action', 'toggle-subgroup');
            subgroupPillButton.setAttribute('data-group-id', group.id);
            subgroupPillButton.setAttribute('data-subgroup-id', subgroup.id);

            const subgroupPillMain = document.createElement('div');
            subgroupPillMain.className = 'subgroup-pill-main';

            const subgroupName = document.createElement('span');
            subgroupName.className = 'subgroup-name';
            subgroupName.textContent = subgroup.name;

            subgroupPillMain.appendChild(subgroupName);

            const subgroupPillActions = document.createElement('div');
            subgroupPillActions.className = 'subgroup-pill-actions';

            const addTaskButton = document.createElement('button');
            addTaskButton.type = 'button';
            addTaskButton.className = 'subgroup-add-task-btn';
            addTaskButton.textContent = '+ Task';
            addTaskButton.setAttribute('data-action', 'add-task');
            addTaskButton.setAttribute('data-group-id', group.id);
            addTaskButton.setAttribute('data-subgroup-id', subgroup.id);

            const subgroupChevron = document.createElement('span');
            subgroupChevron.className = 'subgroup-chevron';
            subgroupChevron.textContent = '▾';

            subgroupPillActions.appendChild(addTaskButton);
            subgroupPillActions.appendChild(subgroupChevron);

            subgroupPillButton.appendChild(subgroupPillMain);
            subgroupPillButton.appendChild(subgroupPillActions);

            const subgroupTasksContainerElement = document.createElement('div');
            subgroupTasksContainerElement.className = 'subgroup-tasks';
            subgroupTasksContainerElement.setAttribute('data-subgroup-tasks-for', subgroup.id);
            subgroupTasksContainerElement.hidden = true;

            const subgroupTasksListElement = document.createElement('ul');
            subgroupTasksListElement.className = 'subgroup-tasks-list';

            subgroup.tasks.forEach(function (task) {
                const subgroupTaskItemElement = document.createElement('li');
                subgroupTaskItemElement.className = 'subgroup-task-item';
                subgroupTaskItemElement.setAttribute('data-task-id', task.id);

                subgroupTaskItemElement.appendChild(createTaskCompleteButton(task.id));

                const subgroupTaskTitleElement = document.createElement('span');
                subgroupTaskTitleElement.className = 'subgroup-task-title';
                subgroupTaskTitleElement.textContent = task.title;

                const subgroupTaskRightElement = document.createElement('div');
                subgroupTaskRightElement.className = 'subgroup-task-right';

                const subgroupTaskDateElement = document.createElement('span');
                subgroupTaskDateElement.className = 'subgroup-task-date';
                subgroupTaskDateElement.textContent = formatTaskDueDateForDisplay(task.dueDate);

                subgroupTaskRightElement.appendChild(subgroupTaskDateElement);
                subgroupTaskRightElement.appendChild(createTaskMenuWrap(task));

                subgroupTaskItemElement.appendChild(subgroupTaskTitleElement);
                subgroupTaskItemElement.appendChild(subgroupTaskRightElement);
                subgroupTasksListElement.appendChild(subgroupTaskItemElement);
            });

            subgroupTasksContainerElement.appendChild(subgroupTasksListElement);

            subgroupListItem.appendChild(subgroupPillButton);
            subgroupListItem.appendChild(subgroupTasksContainerElement);
            subgroupListElement.appendChild(subgroupListItem);
        });

        groupCardElement.appendChild(groupHeaderElement);
        groupCardElement.appendChild(subgroupListElement);

        taskPageElements.groupCardsContainer.appendChild(groupCardElement);
    });
}

export function renderTasksPage() {
    renderTasksDueTodayPanel();
    renderTaskGroups();
}

