import {
    addGroup,
    addSubgroupToGroup,
    addTaskToSubgroupInGroup,
    deleteTaskById,
    updateTaskById,
    findTaskByIdInState,
    getGroupLimitForCurrentTier,
    getSubgroupPerGroupLimitForCurrentTier,
    findGroupByIdInState,
    findSubgroupByIdInGroup,
    loadTasksState
} from './data.js';

import {
    taskPageElements,
    tasksModalContext,
    cachetaskPageElements,
    openGroupModal,
    openSubgroupModal,
    openTaskModal,
    openRenameTaskModal,
    closeTasksModal,
    renderTasksPage
} from './render.js';
import { configureDataStoreRemoteAdapter } from '../firebase.js';

const COLLAPSE_ICON_SRC = 'styles/images/icons/collapse content.svg';
const EXPAND_ICON_SRC = 'styles/images/icons/expand_content.svg';
const collapsedGroupIds = new Set();
const TASK_COMPLETE_REMOVE_DELAY_MS = 420;

function closeAllTaskMenus() {
    document.querySelectorAll('.task-action-menu').forEach(function (menuElement) {
        menuElement.hidden = true;
    });
    document.querySelectorAll('.task-menu-btn').forEach(function (toggleButtonElement) {
        toggleButtonElement.setAttribute('aria-expanded', 'false');
    });
}

function scheduleTaskCompletion(completeButtonElement, taskId) {
    if (!completeButtonElement || !taskId) return;
    if (completeButtonElement.getAttribute('data-completing') === 'true') return;

    completeButtonElement.setAttribute('data-completing', 'true');
    completeButtonElement.classList.add('is-checked');
    completeButtonElement.setAttribute('aria-label', 'Task completed');
    completeButtonElement.setAttribute('aria-busy', 'true');

    window.setTimeout(function () {
        deleteTaskById(taskId);
        closeAllTaskMenus();
        renderTasksPage();
        syncGroupCollapseStateAfterRender();
    }, TASK_COMPLETE_REMOVE_DELAY_MS);
}

function toggleTaskActionMenu(actionElement, menuDropdownElement) {
    const isOpen = Boolean(menuDropdownElement && !menuDropdownElement.hidden);
    if (isOpen) {
        menuDropdownElement.hidden = true;
        actionElement.setAttribute('aria-expanded', 'false');
        return;
    }

    closeAllTaskMenus();
    menuDropdownElement.hidden = false;
    actionElement.setAttribute('aria-expanded', 'true');
}

function setDueTodayCollapsed(isCollapsed) {
    if (!taskPageElements.dueTodayPanel) return;

    taskPageElements.dueTodayPanel.classList.toggle('is-collapsed', isCollapsed);
    if (taskPageElements.toggleDueTodayButton) {
        taskPageElements.toggleDueTodayButton.setAttribute(
            'aria-label',
            isCollapsed ? 'Expand due today' : 'Collapse due today'
        );
    }
    if (taskPageElements.dueTodayToggleIcon) {
        taskPageElements.dueTodayToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
}

function setGroupsCollapsed(isCollapsed) {
    if (!taskPageElements.groupsPanel || !taskPageElements.groupCardsContainer) return;

    taskPageElements.groupsPanel.classList.toggle('is-collapsed', isCollapsed);

    if (taskPageElements.toggleGroupsButton) {
        taskPageElements.toggleGroupsButton.setAttribute(
            'aria-label',
            isCollapsed ? 'Expand groups panel' : 'Collapse groups panel'
        );
    }
    if (taskPageElements.groupsToggleIcon) {
        taskPageElements.groupsToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
}

function setSingleGroupCollapsed(groupCardElement, isCollapsed) {
    if (!groupCardElement) return;

    const groupId = groupCardElement.getAttribute('data-group-id');
    if (!groupId) return;

    groupCardElement.classList.toggle('is-collapsed', isCollapsed);
    if (isCollapsed) {
        collapsedGroupIds.add(groupId);
    } else {
        collapsedGroupIds.delete(groupId);
    }

    const groupToggleButton = groupCardElement.querySelector('[data-action="toggle-group-collapse"]');
    if (groupToggleButton) {
        groupToggleButton.setAttribute('aria-label', isCollapsed ? 'Expand group' : 'Collapse group');
    }

    const groupToggleIcon = groupCardElement.querySelector('[data-group-toggle-icon-for="' + groupId + '"]');
    if (groupToggleIcon) {
        groupToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
}

function updateAllGroupsToggleUI() {
    const isCollapsed = Boolean(taskPageElements.groupsPanel && taskPageElements.groupsPanel.classList.contains('is-collapsed'));

    if (taskPageElements.toggleGroupsButton) {
        taskPageElements.toggleGroupsButton.setAttribute(
            'aria-label',
            isCollapsed ? 'Expand groups panel' : 'Collapse groups panel'
        );
    }
    if (taskPageElements.groupsToggleIcon) {
        taskPageElements.groupsToggleIcon.src = isCollapsed ? EXPAND_ICON_SRC : COLLAPSE_ICON_SRC;
    }
}

function syncGroupCollapseStateAfterRender() {
    if (!taskPageElements.groupCardsContainer) return;

    const allGroupCards = taskPageElements.groupCardsContainer.querySelectorAll('.task-group');
    allGroupCards.forEach(function (groupCardElement) {
        const groupId = groupCardElement.getAttribute('data-group-id');
        setSingleGroupCollapsed(groupCardElement, Boolean(groupId && collapsedGroupIds.has(groupId)));
    });

    updateAllGroupsToggleUI();
}

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
        syncGroupCollapseStateAfterRender();
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
        syncGroupCollapseStateAfterRender();
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
        syncGroupCollapseStateAfterRender();
        return;
    }

    if (tasksModalContext.activeEntityType === 'rename-task') {
        const taskTitleInputElement = document.getElementById('taskTitle');
        const taskDueDateInputElement = document.getElementById('taskDueDate');
        const taskTitleValue = taskTitleInputElement && taskTitleInputElement.value;
        const taskDueDateValue = taskDueDateInputElement && taskDueDateInputElement.value;

        if (!taskTitleValue || !taskDueDateValue || !tasksModalContext.renameTaskId) return;

        const updated = updateTaskById(tasksModalContext.renameTaskId, taskTitleValue, taskDueDateValue);
        if (!updated) return;

        closeTasksModal();
        renderTasksPage();
        syncGroupCollapseStateAfterRender();
        return;
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

    if (taskPageElements.toggleDueTodayButton) {
        taskPageElements.toggleDueTodayButton.addEventListener('click', function () {
            if (!taskPageElements.dueTodayPanel) return;
            setDueTodayCollapsed(!taskPageElements.dueTodayPanel.classList.contains('is-collapsed'));
        });
    }

    if (taskPageElements.toggleGroupsButton) {
        taskPageElements.toggleGroupsButton.addEventListener('click', function () {
            if (!taskPageElements.groupsPanel) return;
            setGroupsCollapsed(!taskPageElements.groupsPanel.classList.contains('is-collapsed'));
        });
    }

    if (taskPageElements.dueTodayList) {
        taskPageElements.dueTodayList.addEventListener('click', function (event) {
            const target = event.target;
            if (!target || !(target instanceof HTMLElement)) return;

            const actionElement = target.closest('[data-action]');
            if (!actionElement) return;

            const actionType = actionElement.getAttribute('data-action');

            if (actionType === 'complete-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                scheduleTaskCompletion(actionElement, taskId);
                return;
            }

            if (actionType === 'task-menu-toggle') {
                event.stopPropagation();
                const menuWrapElement = actionElement.closest('.task-row-menu-wrap');
                const menuDropdownElement =
                    menuWrapElement && menuWrapElement.querySelector('.task-action-menu');
                if (!menuDropdownElement) return;
                toggleTaskActionMenu(actionElement, menuDropdownElement);
                return;
            }

            if (actionType === 'rename-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                const taskRecord = findTaskByIdInState(taskId);
                if (!taskRecord) return;
                closeAllTaskMenus();
                openRenameTaskModal(taskId, taskRecord.title, taskRecord.dueDate);
                return;
            }

            if (actionType === 'delete-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                closeAllTaskMenus();
                deleteTaskById(taskId);
                renderTasksPage();
                syncGroupCollapseStateAfterRender();
            }
        });
    }

    document.addEventListener('click', function (event) {
        const target = event.target;
        if (!(target instanceof Element)) return;
        if (target.closest('.task-row-menu-wrap')) return;
        closeAllTaskMenus();
    });

    if (taskPageElements.groupCardsContainer) {
        taskPageElements.groupCardsContainer.addEventListener('click', function (event) {
            const target = event.target;
            if (!target || !(target instanceof HTMLElement)) return;

            const actionElement = target.closest('[data-action]');
            if (!actionElement) return;

            const actionType = actionElement.getAttribute('data-action');
            if (!actionType) return;

            if (actionType === 'complete-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                scheduleTaskCompletion(actionElement, taskId);
                return;
            }

            if (actionType === 'task-menu-toggle') {
                event.stopPropagation();
                const menuWrapElement = actionElement.closest('.task-row-menu-wrap');
                const menuDropdownElement =
                    menuWrapElement && menuWrapElement.querySelector('.task-action-menu');
                if (!menuDropdownElement) return;
                toggleTaskActionMenu(actionElement, menuDropdownElement);
                return;
            }

            if (actionType === 'rename-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                const taskRecord = findTaskByIdInState(taskId);
                if (!taskRecord) return;
                closeAllTaskMenus();
                openRenameTaskModal(taskId, taskRecord.title, taskRecord.dueDate);
                return;
            }

            if (actionType === 'delete-task') {
                event.stopPropagation();
                const taskId = actionElement.getAttribute('data-task-id');
                if (!taskId) return;
                closeAllTaskMenus();
                deleteTaskById(taskId);
                renderTasksPage();
                syncGroupCollapseStateAfterRender();
                return;
            }

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

                const subgroupCardElement = actionElement.closest('.subgroup');
                if (!subgroupCardElement) return;

                const subgroupTasksContainerElement = subgroupCardElement.querySelector(
                    '[data-subgroup-tasks-for="' + subgroupId + '"]'
                );

                if (!subgroupTasksContainerElement) return;

                subgroupTasksContainerElement.hidden = !subgroupTasksContainerElement.hidden;
                return;
            }

            if (actionType === 'toggle-group-collapse') {
                const groupCardElement = actionElement.closest('.task-group');
                if (!groupCardElement) return;

                const isCurrentlyCollapsed = groupCardElement.classList.contains('is-collapsed');
                setSingleGroupCollapsed(groupCardElement, !isCurrentlyCollapsed);
                updateAllGroupsToggleUI();
            }
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        if (taskPageElements.entityModal && !taskPageElements.entityModal.hidden) {
            closeTasksModal();
            return;
        }
        closeAllTaskMenus();
    });
}

async function initializeTasksPage() {
    try {
        await configureDataStoreRemoteAdapter();
    } catch {
        // Keep local guest mode if Firebase is unavailable.
    }

    await loadTasksState();
    cachetaskPageElements();
    setupTaskPageEventListeners();
    renderTasksPage();
    syncGroupCollapseStateAfterRender();
    setDueTodayCollapsed(false);
    setGroupsCollapsed(false);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTasksPage);
} else {
    initializeTasksPage();
}

