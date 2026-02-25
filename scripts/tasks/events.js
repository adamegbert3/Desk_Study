import {
    addGroup,
    addSubgroupToGroup,
    addTaskToSubgroupInGroup,
    getGroupLimitForCurrentTier,
    getSubgroupPerGroupLimitForCurrentTier,
    findGroupByIdInState,
    findSubgroupByIdInGroup
} from './data.js';

import {
    taskPageElements,
    tasksModalContext,
    cachetaskPageElements,
    openGroupModal,
    openSubgroupModal,
    openTaskModal,
    closeTasksModal,
    renderTasksPage
} from './render.js';

function handleEntityFormSubmit(event) {
    event.preventDefault();
    if (!tasksModalContext.activeEntityType) return;

    if (tasksModalContext.activeEntityType === 'group') {
        const groupNameInputElement = document.getElementById('groupName');
        const groupNameValue = groupNameInputElement && groupNameInputElement.value;
        if (!groupNameValue) return;

        const createdGroup = addGroup(groupNameValue);
        if (!createdGroup) {
            alert('You can have up to ' + getGroupLimitForCurrentTier() + ' groups on the current plan.');
            return;
        }

        closeTasksModal();
        renderTasksPage();
        return;
    }

    if (tasksModalContext.activeEntityType === 'subgroup') {
        const subgroupNameInputElement = document.getElementById('subgroupName');
        const subgroupNameValue = subgroupNameInputElement && subgroupNameInputElement.value;
        if (!subgroupNameValue || !tasksModalContext.parentGroupId) return;

        const createdSubgroup = addSubgroupToGroup(tasksModalContext.parentGroupId, subgroupNameValue);
        if (!createdSubgroup) {
            alert(
                'This group already has the maximum of ' +
                getSubgroupPerGroupLimitForCurrentTier() +
                ' subgroups on the current plan.'
            );
            return;
        }

        closeTasksModal();
        renderTasksPage();
        return;
    }

    if (tasksModalContext.activeEntityType === 'task') {
        const taskTitleInputElement = document.getElementById('taskTitle');
        const taskDueDateInputElement = document.getElementById('taskDueDate');
        const taskTitleValue = taskTitleInputElement && taskTitleInputElement.value;
        const taskDueDateValue = taskDueDateInputElement && taskDueDateInputElement.value;

        if (!taskTitleValue || !taskDueDateValue || !tasksModalContext.parentGroupId || !tasksModalContext.parentSubgroupId) {
            return;
        }

        const createdTask = addTaskToSubgroupInGroup(
            tasksModalContext.parentGroupId,
            tasksModalContext.parentSubgroupId,
            taskTitleValue,
            taskDueDateValue
        );
        if (!createdTask) return;

        closeTasksModal();
        renderTasksPage();
    }
}

function setupTaskPageEventListeners() {
    if (taskPageElements.addGroupButton) {
        taskPageElements.addGroupButton.addEventListener('click', openGroupModal);
    }

    if (taskPageElements.modalBackdrop) {
        taskPageElements.modalBackdrop.addEventListener('click', closeTasksModal);
    }

    if (taskPageElements.modalCancelButton) {
        taskPageElements.modalCancelButton.addEventListener('click', closeTasksModal);
    }

    if (taskPageElements.entityForm) {
        taskPageElements.entityForm.addEventListener('submit', handleEntityFormSubmit);
    }

    if (taskPageElements.groupCardsContainer) {
        taskPageElements.groupCardsContainer.addEventListener('click', function (event) {
            const target = event.target;
            if (!target || !(target instanceof HTMLElement)) return;

            const actionElement = target.closest('[data-action]');
            if (!actionElement) return;

            const actionType = actionElement.getAttribute('data-action');
            if (!actionType) return;

            if (actionType === 'add-subgroup') {
                const parentGroupId = actionElement.getAttribute('data-group-id');
                if (!parentGroupId) return;

                const parentGroup = findGroupByIdInState(parentGroupId);
                if (!parentGroup) return;

                openSubgroupModal(parentGroupId, parentGroup.name);
                return;
            }

            if (actionType === 'add-task') {
                const parentGroupIdForTask = actionElement.getAttribute('data-group-id');
                const parentSubgroupIdForTask = actionElement.getAttribute('data-subgroup-id');

                if (!parentGroupIdForTask || !parentSubgroupIdForTask) return;

                const parentGroupForTask = findGroupByIdInState(parentGroupIdForTask);
                const parentSubgroupForTask = findSubgroupByIdInGroup(parentGroupForTask, parentSubgroupIdForTask);

                if (!parentGroupForTask || !parentSubgroupForTask) return;

                openTaskModal(parentGroupForTask.id, parentSubgroupForTask.id, parentSubgroupForTask.name);
                return;
            }

            if (actionType === 'toggle-subgroup') {
                const subgroupId = actionElement.getAttribute('data-subgroup-id');
                if (!subgroupId) return;

                const subgroupCardElement = taskPageElements.groupCardsContainer.querySelector(
                    '[data-subgroup-id="' + subgroupId + '"]'
                );
                if (!subgroupCardElement) return;

                const subgroupTasksContainerElement = subgroupCardElement.querySelector(
                    '[data-subgroup-tasks-for="' + subgroupId + '"]'
                );

                if (!subgroupTasksContainerElement) return;

                subgroupTasksContainerElement.hidden = !subgroupTasksContainerElement.hidden;
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && taskPageElements.entityModal && !taskPageElements.entityModal.hidden) {
            closeTasksModal();
        }
    });
}

function initializeTasksPage() {
    cachetaskPageElements();
    setupTaskPageEventListeners();
    renderTasksPage();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTasksPage);
} else {
    initializeTasksPage();
}

