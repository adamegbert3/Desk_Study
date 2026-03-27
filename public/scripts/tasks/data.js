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

export function addTaskToSubgroupInGroup(groupId, subgroupId, taskTitle, taskDueDate, taskDueTime = '') {
    const parentGroup = findGroupByIdInState(groupId);
    const parentSubgroup = findSubgroupByIdInGroup(parentGroup, subgroupId);
    if (!parentGroup || !parentSubgroup) return null;

    const trimmedTaskTitle = taskTitle.trim();
    if (!trimmedTaskTitle) return null;

    const dueTime = (taskDueTime || '').trim();
    const task = {
        id: 'task-' + generateEntityId(),
        title: trimmedTaskTitle,
        dueDate: taskDueDate,
        dueTime: dueTime,
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

export function formatTaskDueTimeForDisplay(isoTimeStr) {
    if (!isoTimeStr) return '';
    const parts = isoTimeStr.split(':');
    if (parts.length < 2) return isoTimeStr;

    const hour24 = parseInt(parts[0], 10);
    const minute = parseInt(parts[1], 10);
    if (!Number.isFinite(hour24) || !Number.isFinite(minute)) return isoTimeStr;

    const hour12Raw = hour24 % 12;
    const hour12 = hour12Raw === 0 ? 12 : hour12Raw;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    return hour12 + ':' + String(minute).padStart(2, '0') + ' ' + suffix;
}

export function formatTaskDueDateTimeForDisplay(isoDateStr, isoTimeStr) {
    const datePart = formatTaskDueDateForDisplay(isoDateStr);
    const timePart = formatTaskDueTimeForDisplay(isoTimeStr);
    if (!timePart) return datePart;
    if (!datePart) return timePart;
    return datePart + ' \u00b7 ' + timePart;
}

function parseIsoDateParts(isoDateStr) {
    if (!isoDateStr) return null;
    const parts = isoDateStr.split('-');
    if (parts.length !== 3) return null;

    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) return null;
    return { year, monthIndex, day };
}

function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getTaskDueStatusLabel(isoDateStr, isoTimeStr = '', now = new Date()) {
    if (isoTimeStr instanceof Date) {
        now = isoTimeStr;
        isoTimeStr = '';
    }

    const dateParts = parseIsoDateParts(isoDateStr);
    if (!dateParts) return '';

    const todayStart = startOfDay(now);
    const dueStart = new Date(dateParts.year, dateParts.monthIndex, dateParts.day);
    const dayDiff = Math.round((dueStart.getTime() - todayStart.getTime()) / (24 * 60 * 60 * 1000));

    if (dayDiff < 0) return 'Overdue';
    if (dayDiff === 0) {
        let dueMoment = new Date(dateParts.year, dateParts.monthIndex, dateParts.day, 23, 59, 59, 999);
        if (isoTimeStr) {
            const timeParts = isoTimeStr.split(':');
            if (timeParts.length >= 2) {
                const hour = parseInt(timeParts[0], 10);
                const minute = parseInt(timeParts[1], 10);
                if (Number.isFinite(hour) && Number.isFinite(minute)) {
                    dueMoment = new Date(dateParts.year, dateParts.monthIndex, dateParts.day, hour, minute, 0, 0);
                }
            }
        }

        const msRemaining = dueMoment.getTime() - now.getTime();
        if (msRemaining <= 0) return 'Overdue';

        const minutesRemaining = Math.ceil(msRemaining / (60 * 1000));
        const hours = Math.floor(minutesRemaining / 60);
        const minutes = minutesRemaining % 60;

        if (hours >= 1) {
            return 'Due in ' + hours + 'h' + (minutes ? ' ' + minutes + 'm' : '');
        }
        return 'Due in ' + minutesRemaining + 'm';
    }

    if (dayDiff === 1) return 'Due tomorrow';
    return 'Due in ' + dayDiff + 'd';
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
    const taskDueTime = arguments.length >= 4 ? arguments[3] : '';
    const task = findTaskByIdInState(taskId);
    if (!task) return false;
    const trimmed = (taskTitle || '').trim();
    if (!trimmed || !taskDueDate) return false;
    task.title = trimmed;
    task.dueDate = taskDueDate;
    task.dueTime = (taskDueTime || '').trim();
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

