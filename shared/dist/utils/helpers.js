// Date utilities
export const formatTimestamp = (date) => {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
};
export const formatRelativeTime = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) {
        return 'just now';
    }
    else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60);
        return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600);
        return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }
    else {
        return formatTimestamp(date);
    }
};
export const isToday = (date) => {
    const today = new Date();
    return (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear());
};
export const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return (date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear());
};
// String utilities
export const truncateText = (text, maxLength) => {
    if (text.length <= maxLength)
        return text;
    return text.slice(0, maxLength).trim() + '...';
};
export const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
export const slugify = (text) => {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove non-word chars
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
};
// Array utilities
export const groupBy = (array, key) => {
    return array.reduce((groups, item) => {
        const group = key(item);
        if (!groups[group]) {
            groups[group] = [];
        }
        groups[group].push(item);
        return groups;
    }, {});
};
export const uniqueBy = (array, key) => {
    const seen = new Set();
    return array.filter(item => {
        const k = key(item);
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        return true;
    });
};
// Object utilities
export const pick = (obj, keys) => {
    const result = {};
    keys.forEach(key => {
        if (key in obj) {
            result[key] = obj[key];
        }
    });
    return result;
};
export const omit = (obj, keys) => {
    const result = { ...obj };
    keys.forEach(key => {
        delete result[key];
    });
    return result;
};
export const isEmpty = (obj) => {
    if (obj == null)
        return true;
    if (Array.isArray(obj) || typeof obj === 'string')
        return obj.length === 0;
    if (obj instanceof Map || obj instanceof Set)
        return obj.size === 0;
    return Object.keys(obj).length === 0;
};
// Thought utilities (replacing Message utilities)
export const groupThoughtsByDate = (thoughts) => {
    return groupBy(thoughts, thought => {
        const date = new Date(thought.createdAt);
        if (isToday(date))
            return 'Today';
        if (isYesterday(date))
            return 'Yesterday';
        return date.toDateString();
    });
};
export const getThoughtPreview = (thought, maxLength = 100) => {
    return truncateText(thought.content, maxLength);
};
// User utilities
export const getDisplayName = (user) => {
    return user.username || user.email.split('@')[0];
};
export const getUserInitials = (user) => {
    const displayName = getDisplayName(user);
    return displayName
        .split(' ')
        .map(name => name.charAt(0).toUpperCase())
        .join('')
        .slice(0, 2);
};
// URL utilities
export const isValidUrl = (url) => {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
};
export const extractDomain = (url) => {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname;
    }
    catch {
        return null;
    }
};
// Random utilities
export const generateId = () => {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15);
};
export const generateColor = (seed) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
        '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    return colors[Math.abs(hash) % colors.length];
};
// Debounce utility
export const debounce = (func, wait) => {
    let timeout = null;
    return (...args) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => func(...args), wait);
    };
};
//# sourceMappingURL=helpers.js.map