import PrefabComponent from './PrefabComponent';
import Prefab from './Prefab';
import { camelString } from './util/string-util';
import type { Engine } from './Engine';
import type { World } from './World';
import type { Entity } from './Entity';
import type { ComponentProperties } from './Component'; // For PrefabComponent properties
import type { ComponentClassWithMeta } from './PrefabComponent'; // For component class type

// Structure of component data within a prefab definition
interface PrefabComponentDataConfig {
    type: string;
    properties?: Partial<ComponentProperties>;
    overwrite?: boolean;
}
type PrefabComponentDataItem = string | PrefabComponentDataConfig;

// Structure of the raw prefab data used for registration/deserialization
export interface PrefabData {
    name: string;
    inherit?: string | string[];
    components?: PrefabComponentDataItem[];
    [key: string]: any; // Allow other custom properties on prefabs if needed
}

interface PrefabMap {
    [name: string]: Prefab;
}

export class PrefabRegistry {
    private _prefabs: PrefabMap = {};
    private _rawData: { [name: string]: PrefabData } = {};
    private _engine: Engine;

    constructor(engine: Engine) {
        this._engine = engine;
    }

    /**
     * 遞迴地反序列化預製件資料。
     * 這個方法會處理繼承和組件的解析。
     * @param data - 要反序列化的原始預製件資料。
     * @returns 一個已解析的 Prefab 實例。
     */
    deserialize(data: PrefabData): Prefab {
        // 如果已經在反序列化過程中（為了處理循環依賴），則返回快取的實例。
        if (this._prefabs[data.name]) {
            return this._prefabs[data.name];
        }

        const prefab = new Prefab(data.name);
        // 提早將預製件加入快取，以處理循環繼承。
        this._prefabs[data.name] = prefab;

        let inheritNames: string[] = [];
        if (Array.isArray(data.inherit)) {
            inheritNames = data.inherit;
        } else if (typeof data.inherit === 'string') {
            inheritNames = [data.inherit];
        }

        // 解析父預製件。
        prefab.inherit = inheritNames.map((parentName: string) => {
            // 檢查父預製件是否已在快取中。
            let parentPrefab = this._prefabs[parentName];
            if (!parentPrefab) {
                // 如果不在快取中，從原始資料中尋找並遞迴地反序列化它。
                const parentData = this._rawData[parentName];
                if (parentData) {
                    parentPrefab = this.deserialize(parentData);
                }
            }

            if (!parentPrefab) {
                console.error(`嚴重錯誤：預製件 "${data.name}" 無法繼承自預製件 "${parentName}"，因為它從未被註冊。`);
                // 返回一個虛設的預製件以滿足類型要求，但這是一個有問題的狀態。
                return new Prefab(parentName);
            }
            return parentPrefab;
        });

        const componentConfigs = data.components || [];
        componentConfigs.forEach((componentData: PrefabComponentDataItem) => {
            let componentName: string = 'unknown';
            let properties: Partial<ComponentProperties> | undefined;
            let overwrite: boolean | undefined;

            if (typeof componentData === 'string') {
                componentName = componentData;
            } else if (typeof componentData === 'object' && componentData.type) {
                componentName = componentData.type;
                properties = componentData.properties;
                overwrite = componentData.overwrite;
            }

            const ckey = camelString(componentName);
            // 使用引擎提供的公共方法來獲取組件類別，而不是直接訪問私有屬性。
            const componentClass = this._engine.getComponentClass(ckey) as ComponentClassWithMeta | undefined;

            if (componentClass) {
                prefab.addComponent(new PrefabComponent(componentClass, properties, overwrite));
            } else {
                console.warn(
                    `在預製件 "${data.name}" 中發現無法識別的組件引用 "${componentName}"。請確保該組件已在引擎中註冊。`,
                    componentData
                );
            }
        });
        return prefab;
    }

    /**
     * 註冊一個預製件的原始資料。
     * 這不會立即反序列化，而是在首次被請求時進行（延遲加載）。
     * @param data - 要註冊的預製件資料。
     */
    register(data: PrefabData): void {
        if (this._rawData[data.name]) {
            console.warn(`預製件 "${data.name}" 已被註冊。將覆蓋其原始資料。`);
        }
        this._rawData[data.name] = data;
    }

    /**
     * 按名稱獲取一個已解析的預製件。
     * 如果預製件尚未被解析，此方法將觸發其反序列化。
     * @param name - 預製件的名稱。
     * @returns 一個 Prefab 實例，如果找不到則返回 undefined。
     */
    get(name: string): Prefab | undefined {
        // 如果已在快取中，直接返回。
        if (this._prefabs[name]) {
            return this._prefabs[name];
        }

        // 如果有原始資料，則進行反序列化。
        const rawData = this._rawData[name];
        if (rawData) {
            return this.deserialize(rawData);
        }

        // 若無，則返回 undefined。
        return undefined;
    }

    create(world: World, name: string, properties: Partial<ComponentProperties> = {}): Entity | undefined {
        const prefab = this.get(name);

        if (!prefab) {
            console.warn(
                `無法實例化預製件 "${name}"，因為它未被註冊。`
            );
            return undefined;
        }

        const entity = world.createEntity(name + "_"); // Pass a unique ID base for the entity

        // Temporarily disable query eligibility during component additions for performance
        entity._qeligible = false;
        prefab.applyToEntity(entity, properties);
        entity._qeligible = true;
        entity._candidacy(); // Manually trigger candidacy check after all components are added

        return entity;
    }
}
