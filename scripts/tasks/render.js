import {
    taskGroupsState,
    getTodayDateString,
    getTasksDueTodayFromState,
    formatTaskDueDateForDisplay
} from './data.js';

export const taskPageElements = {
    addGroupButton: null,
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
    parentSubgroupId: null
};

export function cachetaskPageElements() {
    taskPageElements.addGroupButton = document.getElementById('addGroupBtn');
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

export function closeTasksModal() {
    if (!taskPageElements.entityModal) return;

    taskPageElements.entityModal.hidden = true;
    tasksModalContext.activeEntityType = null;
    tasksModalContext.parentGroupId = null;
    tasksModalContext.parentSubgroupId = null;

    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.setAttribute('aria-expanded', 'false');
    }
    if (taskPageElements.entityForm) {
        taskPageElements.entityForm.reset();
    }

    document.body.style.overflow = '';
}

export function renderTasksDueTodayPanel() {
    if (!taskPageElements.dueTodayList) return;

    const tasksDueToday = getTasksDueTodayFromState();
    taskPageElements.dueTodayList.textContent = '';

    tasksDueToday.forEach(function (task) {
        const listItemElement = document.createElement('li');
        const taskPillElement = document.createElement('span');

        taskPillElement.className = 'task-pill task-pill--due-today';
        taskPillElement.textContent = task.title;
        taskPillElement.setAttribute('data-task-id', task.id);

        listItemElement.appendChild(taskPillElement);
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

        groupHeaderElement.appendChild(groupTitleElement);
        groupHeaderElement.appendChild(addSubgroupButtonElement);

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

                const subgroupTaskTitleElement = document.createElement('span');
                subgroupTaskTitleElement.className = 'subgroup-task-title';
                subgroupTaskTitleElement.textContent = task.title;

                const subgroupTaskDateElement = document.createElement('span');
                subgroupTaskDateElement.className = 'subgroup-task-date';
                subgroupTaskDateElement.textContent = formatTaskDueDateForDisplay(task.dueDate);

                subgroupTaskItemElement.appendChild(subgroupTaskTitleElement);
                subgroupTaskItemElement.appendChild(subgroupTaskDateElement);
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

