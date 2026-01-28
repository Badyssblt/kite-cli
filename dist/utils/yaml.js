"use strict";
// Utilitaire YAML (sans lib externe)
Object.defineProperty(exports, "__esModule", { value: true });
exports.toYAML = toYAML;
function toYAML(obj, indent = 0) {
    const spaces = '  '.repeat(indent);
    let yaml = '';
    if (Array.isArray(obj)) {
        for (const item of obj) {
            if (typeof item === 'object' && item !== null) {
                yaml += `${spaces}-\n${toYAML(item, indent + 1)}`;
            }
            else {
                yaml += `${spaces}- ${item}\n`;
            }
        }
    }
    else if (typeof obj === 'object' && obj !== null) {
        for (const [key, value] of Object.entries(obj)) {
            if (value === null || value === undefined)
                continue;
            if (Array.isArray(value)) {
                yaml += `${spaces}${key}:\n`;
                yaml += toYAML(value, indent + 1);
            }
            else if (typeof value === 'object') {
                yaml += `${spaces}${key}:\n`;
                yaml += toYAML(value, indent + 1);
            }
            else if (typeof value === 'string') {
                // Échapper les strings qui contiennent des caractères spéciaux
                if (value.includes(':') || value.includes('$') || value.includes('{')) {
                    yaml += `${spaces}${key}: "${value}"\n`;
                }
                else {
                    yaml += `${spaces}${key}: ${value}\n`;
                }
            }
            else {
                yaml += `${spaces}${key}: ${value}\n`;
            }
        }
    }
    return yaml;
}
