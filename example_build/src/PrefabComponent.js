import merge from 'deepmerge';
export default class PrefabComponent {
    constructor(clazz, properties = {}, overwrite = true) {
        this.componentClass = clazz;
        this.properties = properties;
        this.overwrite = overwrite;
    }
    applyToEntity(entity, initialProps = {}) {
        const targetClass = this.componentClass;
        if (!targetClass.allowMultiple && entity.has(targetClass)) {
            if (!this.overwrite) {
                return; // Don't overwrite, and component already exists
            }
            // Component exists and we need to overwrite it (or it's a single-instance component)
            // We need to get the existing component instance to remove it.
            // The entity stores components by their _ckey.
            const existingComponentInstance = entity[targetClass.prototype._ckey];
            if (existingComponentInstance) {
                entity.remove(existingComponentInstance);
            }
        }
        // Merge prefab-defined properties with any instance-specific initial properties
        // initialProps take precedence if there are clashes, due to typical merge behavior.
        // For deep merge, if this.properties has {a:1, b:1} and initialProps has {b:2, c:2}, result is {a:1, b:2, c:2}
        const finalProps = merge(this.properties, initialProps);
        entity.add(targetClass, finalProps);
    }
}
