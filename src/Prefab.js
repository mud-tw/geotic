export default class Prefab {
    constructor(name) {
        this.inherit = []; // Can be Prefab instances (resolved) or strings (unresolved)
        this.components = [];
        this.name = name;
    }
    addComponent(prefabComponent) {
        this.components.push(prefabComponent);
    }
    applyToEntity(entity, prefabProps = {}) {
        this.inherit.forEach((parentPrefab) => {
            parentPrefab.applyToEntity(entity, prefabProps);
        });
        const arrCompsCounter = {};
        this.components.forEach((pComponent) => {
            const componentClass = pComponent.componentClass;
            const ckey = componentClass.prototype._ckey;
            let initialCompProps = {}; // TODO: Type this better based on component properties
            if (componentClass.allowMultiple) {
                if (componentClass.keyProperty && pComponent.properties) {
                    const keyPropName = componentClass.keyProperty;
                    const keyValue = pComponent.properties[keyPropName];
                    if (prefabProps[ckey] && prefabProps[ckey][keyValue]) {
                        initialCompProps = prefabProps[ckey][keyValue];
                    }
                }
                else {
                    // Non-keyed multiple components (array)
                    if (!arrCompsCounter[ckey]) {
                        arrCompsCounter[ckey] = 0;
                    }
                    const currentIndex = arrCompsCounter[ckey];
                    if (prefabProps[ckey] && Array.isArray(prefabProps[ckey]) && prefabProps[ckey][currentIndex]) {
                        initialCompProps = prefabProps[ckey][currentIndex];
                    }
                    arrCompsCounter[ckey]++;
                }
            }
            else {
                // Single component
                if (prefabProps[ckey]) {
                    initialCompProps = prefabProps[ckey];
                }
            }
            pComponent.applyToEntity(entity, initialCompProps);
        });
        return entity;
    }
}
//# sourceMappingURL=Prefab.js.map