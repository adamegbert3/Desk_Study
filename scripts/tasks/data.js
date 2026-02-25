const freeTierGroupLimit = 20;
const premiumTierGroupLimit = 100;
const freeTierSubgroupLimitPerGroup = 25;
const premiumTierSubgroupLimitPerGroup = 75;

// Premium limits - not implemented yet
const isPremiumTierEnabled = false;

export const taskGroupsState = [];

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

