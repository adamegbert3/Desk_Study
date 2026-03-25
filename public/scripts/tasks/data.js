const freeTierGroupLimit = 20;
const premiumTierGroupLimit = 100;
const freeTierSubgroupLimitPerGroup = 25;
const premiumTierSubgroupLimitPerGroup = 75;

// Premium limits - not implemented yet
const isPremiumTierEnabled = false;

export const taskGroupsState = [];

function saveTasksState() {
    if (window.dataStore && typeof window.dataStore.saveTasks === 'function') {
        void window.dataStore.saveTasks(taskGroupsState);
        return;
    }
    try {
        window.localStorage.setItem('deskStudyTasksStateV1', JSON.stringify(taskGroupsState));
    } catch {}
}

export async function loadTasksState() {
    let loaded = [];
    if (window.dataStore && typeof window.dataStore.loadTasks === 'function') {
        loaded = (await window.dataStore.loadTasks()) || [];
    } else {
        try {
            loaded = JSON.parse(window.localStorage.getItem('deskStudyTasksStateV1') || '[]');
        } catch {
            loaded = [];
        }
    }

    if (!Array.isArray(loaded)) loaded = [];
    taskGroupsState.splice(0, taskGroupsState.length, ...loaded);
}

export function getTodayDateString() {
    const d = new Date();
    return (
        d.getFullYear() +
        '-' +
        String(d.getMonth() + 1).padStart(2, '0') +
        '-' +
        String(d.getDate()).padStart(2, '0')
    );
}

export function getGroupLimitForCurrentTier() {
    return isPremiumTierEnabled ? premiumTierGroupLimit : freeTierGroupLimit;
}

export function getSubgroupPerGroupLimitForCurrentTier() {
    return isPremiumTierEnabled ? premiumTierSubgroupLimitPerGroup : freeTierSubgroupLimitPerGroup;
}

function generateEntityId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

export function findGroupByIdInState(groupId) {
    return taskGroupsState.find(function (group) {
        return group.id === groupId;
    }) || null;
}

export function findSubgroupByIdInGroup(group, subgroupId) {
    if (!group) return null;
    return group.subgroups.find(function (subgroup) {
        return subgroup.id === subgroupId;
    }) || null;
}

export function addGroup(groupName) {
    const trimmedGroupName = groupName.trim();
    if (!trimmedGroupName) return null;
    if (taskGroupsState.length >= getGroupLimitForCurrentTier()) return null;

    const group = {
        id: 'group-' + generateEntityId(),
        name: trimmedGroupName,
        subgroups: []
    };

    taskGroupsState.push(group);
    saveTasksState();
    return group;
}

export function addSubgroupToGroup(groupId, subgroupName) {
    const parentGroup = findGroupByIdInState(groupId);
    if (!parentGroup) return null;

    const trimmedSubgroupName = subgroupName.trim();
    if (!trimmedSubgroupName) return null;
    if (parentGroup.subgroups.length >= getSubgroupPerGroupLimitForCurrentTier()) return null;

    const subgroup = {
        id: 'subgroup-' + generateEntityId(),
        name: trimmedSubgroupName,
        groupId: parentGroup.id,
        tasks: []
    };

    parentGroup.subgroups.push(subgroup);
    saveTasksState();
    return subgroup;
}

export function addTaskToSubgroupInGroup(groupId, subgroupId, taskTitle, taskDueDate) {
    const parentGroup = findGroupByIdInState(groupId);
    const parentSubgroup = findSubgroupByIdInGroup(parentGroup, subgroupId);
    if (!parentGroup || !parentSubgroup) return null;

    const trimmedTaskTitle = taskTitle.trim();
    if (!trimmedTaskTitle) return null;

    const task = {
        id: 'task-' + generateEntityId(),
        title: trimmedTaskTitle,
        dueDate: taskDueDate,
        subgroupId: parentSubgroup.id,
        groupId: parentGroup.id
    };

    parentSubgroup.tasks.push(task);
    saveTasksState();
    return task;
}

export function getTasksDueTodayFromState() {
    const today = getTodayDateString();
    const tasksDueToday = [];

    taskGroupsState.forEach(function (group) {
        group.subgroups.forEach(function (subgroup) {
            subgroup.tasks.forEach(function (task) {
                if (task.dueDate === today) {
                    tasksDueToday.push(task);
                }
            });
        });
    });

    return tasksDueToday;
}

export function formatTaskDueDateForDisplay(isoDateStr) {
    if (!isoDateStr) return '';
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return isoDateStr;

    const year = parts[0];
    const month = String(parseInt(parts[1], 10));
    const day = String(parseInt(parts[2], 10));

    return month + '/' + (day.length === 1 ? '0' + day : day) + '/' + year;
}

export function findTaskByIdInState(taskId) {
    if (!taskId) return null;
    for (const group of taskGroupsState) {
        if (!group || !Array.isArray(group.subgroups)) continue;
        for (const subgroup of group.subgroups) {
            if (!subgroup || !Array.isArray(subgroup.tasks)) continue;
            const task = subgroup.tasks.find(function (t) {
                return t && t.id === taskId;
            });
            if (task) return task;
        }
    }
    return null;
}

export function updateTaskById(taskId, taskTitle, taskDueDate) {
    const task = findTaskByIdInState(taskId);
    if (!task) return false;
    const trimmed = (taskTitle || '').trim();
    if (!trimmed || !taskDueDate) return false;
    task.title = trimmed;
    task.dueDate = taskDueDate;
    saveTasksState();
    return true;
}

export function deleteTaskById(taskId) {
    if (!taskId) return false;

    for (const group of taskGroupsState) {
        if (!group || !Array.isArray(group.subgroups)) continue;

        for (const subgroup of group.subgroups) {
            if (!subgroup || !Array.isArray(subgroup.tasks)) continue;

            const taskIndex = subgroup.tasks.findIndex(function (task) {
                return task && task.id === taskId;
            });

            if (taskIndex !== -1) {
                subgroup.tasks.splice(taskIndex, 1);
                saveTasksState();
                return true;
            }
        }
    }

    return false;
}

