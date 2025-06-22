# Geotic ECS 專案分析與改良計畫

本文檔旨在分析現有的 Geotic Entity-Component-System (ECS) 函式庫的架構，並提出可以改良和增強的方向。

## 1. 現有專案架構分析

Geotic 是一個使用 TypeScript 編寫的 ECS 函式庫。其核心架構包含以下主要組件：

*   **Engine**: 最上層的容器，管理 `ComponentRegistry` 和 `PrefabRegistry`。負責註冊組件、預製體 (Prefab) 以及建立 `World` 實例。
*   **World**: 管理實體 (Entity) 和查詢 (Query) 的集合。負責實體的建立、銷毀、序列化和反序列化。
*   **Entity**: 代表一個遊戲物件或任何需要管理的個體。它是組件 (Component) 的容器，並使用位元遮罩 (`_cbits`) 進行高效的組件查詢。
*   **Component**: 資料的容器，可以附加到實體上以定義其特性或行為。組件可以定義生命週期方法和事件處理器。
*   **ComponentRegistry**: 管理組件類別的註冊，為每個組件分配唯一的鍵 (`_ckey`) 和位元值 (`_cbit`)。
*   **Query**: 允許高效地檢索具有特定組件組合的實體集合。
*   **Prefab / PrefabRegistry**: 支援實體範本的定義和實例化。
*   **EntityEvent**: 提供實體觸發事件和組件監聽事件的機制。

**主要架構特點**:

*   **解耦合**: ECS 模式本身促進了關注點分離。
*   **資料導向**: 強調實體作為資料 (組件) 的聚合。
*   **動態組合**: 可以透過新增/移除組件來動態改變實體的行為和資料。
*   **效率**:
    *   使用位元遮罩進行快速的組件存在檢查。
    *   查詢機制設計用於高效檢索實體。
*   **序列化/反序列化**: 支援 World 和 Entity 的序列化與反序列化。
*   **TypeScript**: 利用 TypeScript 提供靜態型別檢查，有助於程式碼維護。

## 2. 改良與增強方向建議

以下是針對 Geotic 函式庫提出的一些潛在改良與增強方向：

### 2.1. 增強型別安全與開發者體驗

*   **`Entity.add` 中更強的組件屬性型別**:
    *   **問題**: `entity.add(ComponentClass, properties)` 中的 `properties` 引數目前型別為 `any`。
    *   **建議**: 利用 TypeScript 的進階型別 (如 `ConstructorParameters`、對映型別) 從 `ComponentClass` 的建構函式或其靜態 `properties` 定義中推斷正確的屬性型別。
    *   **益處**: 改善開發者體驗，減少因組件初始化不正確導致的執行期錯誤。
*   **泛型化的 `Entity.get` 和 `Entity.has`**:
    *   **問題**: `entity.get(ComponentClass)` 可能回傳泛用的 `Component` 型別。
    *   **建議**: 將這些方法泛型化，例如 `entity.get<T extends Component>(clazz: ComponentClass<T>): T | undefined`。
    *   **益處**: 減少函式庫使用者進行型別轉換的需求。
*   **更嚴格的 `tsconfig.json` 選項**:
    *   **建議**: 啟用更嚴格的 TypeScript 編譯器選項，如 `strictNullChecks`, `noImplicitAny`, `noImplicitThis`, `alwaysStrict` (若尚未完全實施)。
    *   **益處**: 在編譯時期捕獲更多潛在錯誤。

### 2.2. 改善封裝與 API 設計

*   **減少對 Engine/World 內部成員的直接存取**:
    *   **問題**: `World.ts` 存取 `engine._components` 和 `engine._prefabs`。`Entity.ts` 存取 `world._candidate` 和 `world._destroyed`。
    *   **建議**: 在 `Engine` 和 `World` 中為這些互動引入公用 getter 方法或專用介面方法。
    *   **益處**: 更清晰的 API 協定，更易於重構，減少誤用風險。
*   **一致的命名約定**:
    *   **觀察**: 大多數內部屬性以 `_` 開頭。確保此約定一致應用於所有非公用成員。
    *   **益處**: 提高程式碼可讀性和可維護性。

### 2.3. 效能最佳化 (需進一步研究)

*   **實體與組件的物件池 (Object Pooling)**:
    *   **建議**: 對於效能要求高的應用 (例如有大量短生命週期實體/組件的遊戲)，考慮實作物件池以減少記憶體回收的負擔。
    *   **益處**: 減少 GC 停頓，可能帶來更流暢的效能。
    *   **注意**: 會增加複雜性，應透過基準測試證明其必要性。
*   **查詢最佳化**:
    *   **建議**: 分析是否有情境可以透過查詢快取或更複雜的資料結構進一步提升查詢速度，特別是對於複雜查詢或大量實體。
    *   **益處**: 加快系統執行速度。

### 2.4. 增強功能集

*   **反應式查詢 / 可觀察查詢 (Reactive Queries / Observable Queries)**:
    *   **建議**: 允許應用程式的其他部分訂閱查詢結果的變更 (實體進入/離開查詢)。
    *   **益處**: 簡化需要對實體組成變化做出反應的系統邏輯。
*   **系統 (System) 抽象/基礎類別**:
    *   **建議**: 提供一個可選的 `System` 基礎類別或介面，引導使用者。此類別可與 `World` 或 `Engine` 整合以進行更新，並自動管理相關查詢。
    *   **益處**: 提供更完整的 ECS 框架體驗。
*   **更完善的事件系統**:
    *   **建議**: 考慮如事件冒泡/捕獲、全域事件匯流排 (World/Engine 級別事件)、型別化事件等功能。
    *   **益處**: 更靈活和健壯的事件處理。
*   **World 與 Engine 的生命週期掛鉤 (Lifecycle Hooks)**:
    *   **建議**: 為 `World` 和 `Engine` 新增如 `onInitialize`, `onUpdateStart`, `onUpdateEnd`, `onDestroy` 等生命週期掛鉤。
    *   **益處**: 更好地與外部系統或遊戲迴圈整合。
*   **進階序列化/反序列化選項**:
    *   **建議**:
        *   支援在組件資料中參照實體 (例如，一個 `Target` 組件儲存另一個實體的 ID)。反序列化過程需要處理這些參照的解析。
        *   允許為特定組件型別自訂序列化/反序列化器。
    *   **益處**: 更強大和靈活的狀態管理。

### 2.5. 文件與範例

*   **API 文件產生**:
    *   **建議**: 使用 TypeDoc 等工具從 TSDoc 註解產生全面的 API 文件。
    *   **益處**: 使用者更容易理解和使用函式庫。
*   **更複雜的範例**:
    *   **建議**: 新增展示進階查詢、巢狀預製體、事件處理和簡單系統實作等功能的範例。
    *   **益處**: 協助使用者掌握函式庫的全部潛力。
*   **最佳實踐指南**:
    *   **建議**: 編寫一份文件，概述使用函式庫的最佳實踐。
    *   **益處**: 協助使用者使用 Geotic 編寫更高效和可維護的程式碼。

### 2.6. 測試

*   **提高測試覆蓋率**:
    *   **建議**: 確保所有功能都有高覆蓋率的測試，特別是邊界條件、序列化/反序列化和查詢邏輯。
    *   **益處**: 更健壯和可靠的函式庫。
*   **效能基準測試**:
    *   **建議**: 擴展現有的基準測試 (`benchmark.ts`) 以涵蓋更多情境，並定期執行追蹤。
    *   **益處**: 有助於識別效能回歸並驗證最佳化。

## 3. TODO 子任務表 (初步)

以下是根據上述改良建議制定的初步 TODO 子任務列表。在實施前，每個任務都應進一步細化。

### 3.1. 型別安全與開發者體驗
*   [x] **T1.1**: 研究並實作 `Entity.add` 的強型別 `properties`。 (已實作 `AddPropertiesArg` 並更新 `Entity.add`。)
*   [x] **T1.2**: 將 `Entity.get` 和 `Entity.has` 方法改為泛型。 (已確認現有實作已滿足此要求。)
*   [x] **T1.3**: 檢閱並強化 `tsconfig.json` 中的嚴格編譯選項，修正因此產生的型別錯誤。 (已檢閱 `tsconfig.json`，`"strict": true` 已啟用，滿足要求。)

### 3.2. 封裝與 API 設計
*   [x] **T2.1**: 識別 `World` 和 `Entity` 中對 `Engine` 和 `World` 內部成員的直接存取點。 (完成於第一階段分析，添加註解時已大量識別並確認多數通過公開方法。)
*   [x] **T2.2**: 為 T2.1 中識別的存取點設計並實作公用介面/getter 方法。 (確認 T2.1 中提到的主要存取點已透過現有或先前調整的公開方法處理。)
*   [x] **T2.3**: 檢閱專案，確保內部/私有成員的命名一致性 (例如，使用 `_` 前綴)。 (完成於第一階段分析，添加註解時已檢閱。)

### 3.3. 效能最佳化
*   [x] **T3.1**: (研究) 評估在 Geotic 中引入物件池 (Entity/Component) 的潛在效益與複雜性。 (研究完成 - 參見 4.1 節總結)
*   [x] **T3.2**: (研究) 分析現有查詢機制，找出潛在的效能瓶頸與最佳化空間。 (研究完成 - 參見 4.2 節總結)

### 3.4. 功能增強
*   [x] **T4.1**: (研究/設計) 設計反應式/可觀察查詢的 API 與實作機制。 (研究完成 - 參見 4.3 節總結)
*   [ ] **T4.2**: (設計) 設計一個可選的 `System` 基礎類別/介面及其與 `World`/`Engine` 的整合方式。
*   [ ] **T4.3**: (研究/設計) 評估並設計更進階的事件系統功能 (如全域事件、型別化事件)。
*   [ ] **T4.4**: (設計) 確定 `World` 和 `Engine` 所需的生命週期掛鉤，並設計其 API。
*   [ ] **T4.5**: (研究/設計) 設計支援實體參照的序列化/反序列化機制。
*   [ ] **T4.6**: (設計) 設計允許自訂組件序列化器的機制。

### 3.5. 文件與範例
*   [ ] **T5.1**: 設定 TypeDoc 或類似工具，為專案產生 API 文件。
*   [ ] **T5.2**: 撰寫至少一個展示進階功能的複雜範例 (例如，包含系統邏輯的迷你遊戲片段)。
*   [ ] **T5.3**: 開始撰寫 Geotic 函式庫使用的最佳實踐指南。

### 3.6. 測試
*   [ ] **T6.1**: 分析目前測試覆蓋率 (可使用工具輔助)。
*   [ ] **T6.2**: 針對測試覆蓋率較低的模組或功能，編寫新的單元/整合測試。
*   [ ] **T6.3**: 擴展 `benchmark.ts`，加入更多效能測試情境 (如大量實體建立/銷毀、複雜查詢)。

---

請檢閱此計畫。確認後即可開始逐步實施。

## 4. Research Findings and Recommendations (T3.x 階段研究總結)

本節記錄 T3.x 系列研究任務的發現與建議。

### 4.1. T3.1 物件池 (Object Pooling) 機制評估

*   **核心概念**: 從預先分配的物件池中重複使用物件 (實體、組件)，而非頻繁地建立與銷毀，旨在減少記憶體回收 (GC) 的壓力並可能提升實例化速度。
*   **Geotic 結構分析**:
    *   **整合點**:
        *   組件: `Entity.add()` (獲取而非新建 `new Component()`) 和 `Component._onDestroyed()` (釋放回池中)。
        *   實體: `World.createEntity()` (獲取而非新建 `new Entity()`) 和 `Entity.destroy()` (釋放回池中)。
    *   **狀態重設**: 此為主要複雜點。
        *   組件: 回池時需重設所有屬性至其 `static properties` 定義的初始狀態，重新獲取時再應用新的初始屬性。現有的建構函式邏輯可作為 `reset()` 方法的基礎。
        *   實體: 需清空其組件列表 (並將這些組件釋放回各自的池中)、重設 `_cbits`、管理 ID (若 ID 可在建立時指定) 和 `isDestroyed` 狀態。`Entity.destroy()` 的現有邏輯部分可供參考。
*   **對 Geotic 的潛在益處**:
    *   在高頻繁建立/銷毀實體或組件的場景 (如粒子效果、遊戲中的子彈、頻繁變更的臨時狀態組件) 中，能顯著減少 GC 停頓，提升效能一致性。
*   **實作複雜性與挑戰**:
    *   **基礎建設**: 需要新的池管理類別 (如 `EntityPool`, `ComponentPoolManager`)。
    *   **狀態重設邏輯**: 確保所有被池化物件能被徹底且正確地重設是關鍵且複雜。
    *   **API 影響**: 內部邏輯變動較大。對使用者而言，若 Geotic 主要透過 `entity.add()` 建立組件，則 API 影響較小。
    *   **記憶體足跡**: 池本身會持有未使用的物件，可能增加基礎記憶體用量。
    *   **除錯**: 不正確的重設邏輯可能導致物件帶有舊狀態，引發難以追蹤的錯誤。
*   **可行性與建議**:
    *   **結論**: 在 Geotic 中實作物件池是**可行但複雜的**。
    *   **建議**:
        1.  **暫緩立即全面實作**: 鑑於其複雜性，不建議立即在整個函式庫中實作。
        2.  **優先進行基準測試 (Benchmark)**: 應先擴展 `benchmark.ts` (呼應 T6.3)，模擬高物件流失率的場景，以數據證明 GC 或物件流失確實是 Geotic 在某些情境下的顯著瓶頸。
        3.  **概念驗證 (Proof-of-Concept, PoC)**: 若基準測試顯示有此需求，可先針對少量常用組件類型或僅針對實體進行 PoC 實作，以實際評估效能增益與複雜度。
        4.  **可配置性**: 若最終決定實作，應考慮提供配置選項 (如：啟用/停用特定類型的池、設定池大小等)。

總體而言，物件池對特定高效能需求的 Geotic 應用可能帶來好處，但其實作成本與複雜性較高，需先透過基準測試驗證其必要性。

### 4.2. T3.2 查詢機制分析與優化空間評估

*   **現有查詢機制回顧**:
    *   實體 (`Entity`) 使用 `_cbits` (位元遮罩) 代表其擁有的組件類型。
    *   查詢 (`Query`) 在建立時，會將其過濾條件 (`any`, `all`, `none`) 編譯成組合位元遮罩。
    *   核心匹配邏輯 `query.matches(entity)` 使用位元運算，非常高效。
    *   實體組件變更時 (`add`/`remove`/`destroy`) 會觸發 `entity._candidacy()` -> `world.entityCompositionChanged(entity)`。
    *   `world.entityCompositionChanged(entity)` 會遍歷**所有**在該世界註冊的查詢，並呼叫每個查詢的 `query.candidate(entity)` 方法。
    *   `query.candidate(entity)` 負責判斷實體是否應加入或移出其內部快取 (`_cache`，一個陣列)，並觸發相應的回呼 (`onEntityAdded`/`onRemoved`)。此方法使用 `_cache.indexOf()` (檢查存在) 和 `_cache.splice()` (移除)。
    *   查詢建立時會執行 `query.refresh()`，遍歷世界中所有實體來初始填充快取。
    *   `query.get()` 方法根據 `immutableResult` 選項返回快取的副本或直接引用。

*   **效能考量點**:
    *   `query.matches()`: 位元運算，速度極快，基本無憂。
    *   `world.entityCompositionChanged`: 當世界中查詢數量很多時，每次實體變更都會導致遍歷所有查詢，帶來 O(查詢總數) 的固定開銷。
    *   `query.candidate()`:
        *   `_cache.indexOf()`: 時間複雜度 O(N_cache_size)，N 為查詢快取中的實體數量。
        *   `_cache.splice()`: 時間複雜度 O(N_cache_size)。
        *   對於匹配大量實體的查詢，這兩者可能成為瓶頸。
    *   `query.refresh()`: 建立查詢時執行，成本約為 O(世界實體總數 * candidate成本)。對於大量實體的世界，新建查詢的成本可能較高。
    *   `query.get()`: 若 `immutableResult` 為 true (預設)，則涉及 O(N_cache_size) 的陣列複製成本。

*   **潛在優化建議與評估**:
    *   **1. 優化 `Query._cache` 操作 (高優先建議)**:
        *   **方法**: 維護一個 `Map<EntityId, IndexInCache>` 與 `_cache` (陣列) 同步。使用 Map 快速定位索引，移除時採用 "swap-pop" 技巧 (將待移除元素與陣列末尾元素交換後 `pop()`)。
        *   **效益**: 將 `query.candidate()` 中檢查存在 (`has`)、加入 (`add`)、移除 (`remove`) 操作的平均時間複雜度降至 O(1)。顯著提升匹配大量實體的查詢的更新效能。
        *   **複雜度**: 中等。
    *   **2. 優化 `query.get()` 不可變結果的複製 (建議採納)**:
        *   **方法**: 為 `_cache` 引入版本號或"髒"標記。當 `immutableResult` 為 true 時，`get()` 返回上一次的快取副本。僅當 `_cache` 實際被修改後 (髒標記置位)，下一次 `get()` 才重新生成副本並清除髒標記。
        *   **效益**: 若 `get()` 在兩次快取實際變動之間被多次呼叫，可避免不必要的陣列複製。
        *   **複雜度**: 低至中等。
    *   **3. 減少 `candidate()` 的冗餘呼叫 (未來可考慮)**:
        *   **方法**: 讓查詢訂閱其真正關心的組件類型變更。`world.entityCompositionChanged` 僅通知相關查詢。
        *   **效益**: 世界中查詢極多且多數查詢的過濾條件不相交時，效益明顯。
        *   **複雜度**: 較高。需要更改 `World` 與 `Query` 的互動機制。
    *   **4. 延遲/批次查詢更新 (視情況考慮)**:
        *   **方法**: `world.entityCompositionChanged` 不立即處理，而是將變動實體加入"髒實體列表"。由 `world.processQueryUpdates()` 在每幀特定時機 (如系統更新前後) 統一處理。
        *   **效益**: 若實體在一幀內多次變動，可減少重複更新。但改變了查詢結果的即時性。
        *   **複雜度**: 中等。
    *   **5. 基於原型 (Archetype) 的架構 (重大架構調整)**:
        *   **方法**: 根本上改變實體儲存和查詢方式，將具有相同組件組合的實體分組管理。
        *   **效益**: 極致的查詢效能。
        *   **複雜度**: 非常高。Geotic 目前的位元遮罩已是類似概念的簡化版。 (可能超出增量改進範疇)

*   **查詢優化建議優先級**:
    1.  實施 `Query._cache` 操作優化 (Map + swap-pop)。
    2.  實施 `query.get()` 不可變結果的複製優化 (版本號/髒標記)。
    3.  進行基準測試，若 `world.entityCompositionChanged` 的遍歷本身成為瓶頸，再考慮更複雜的查詢訂閱模型。

總體而言，Geotic 的查詢機制核心 (位元遮罩匹配) 非常高效。主要的優化空間在於管理查詢結果集 (`_cache`) 的操作，以及在查詢數量極多時減少不必要的 `candidate` 呼叫。建議優先實施針對 `_cache` 操作的優化。

### 4.3. T4.1 反應式/可觀察查詢 (Reactive/Observable Queries) API 與實作機制研究

*   **核心概念**:
    *   反應式查詢允許應用程式的其他部分訂閱查詢結果集的變更，而非輪詢 `query.get()`。
    *   當實體因組件變更而開始匹配查詢條件 (進入查詢) 或停止匹配查詢條件 (離開查詢) 時，訂閱者會收到通知。
*   **效益**:
    *   簡化需要對實體組成動態變化做出反應的系統邏輯 (例如，渲染系統根據實體是否可見來建立/銷毀渲染物件)。
    *   提升效能，避免手動比較前後兩幀的查詢結果來偵測差異。
    *   促進事件驅動的程式設計模式。
*   **Geotic 現狀分析**:
    *   `Query.ts` 已包含基礎的反應式回呼機制：`onEntityAdded(callback)` 和 `onEntityRemoved(callback)`。
    *   這些回呼由 `Query.candidate()` 在實體匹配狀態改變時觸發。
    *   **主要缺失**:
        *   缺乏取消訂閱 (unsubscribe) 的機制，可能導致記憶體洩漏或在過期物件上執行回呼。
        *   新訂閱者不會立即收到查詢中已存在實體的通知。
        *   回呼中的錯誤未被隔離，可能影響其他監聽器。
*   **API 設計建議 (基於 `query.observe(observer, options?)`)**:
    *   引入 `QuerySubscription` 介面:
        ```typescript
        interface QuerySubscription {
            unsubscribe(): void;
            readonly closed: boolean;
        }
        ```
    *   引入 `EntityObserver` 介面:
        ```typescript
        interface EntityObserver {
            onEnter?: (entity: Entity) => void; // 實體進入查詢
            onExit?: (entity: Entity) => void;  // 實體離開查詢
        }
        ```
    *   引入 `ObserveOptions` 介面:
        ```typescript
        interface ObserveOptions {
            emitCurrent?: boolean; // 若為 true，訂閱時立即對已在查詢中的實體觸發 onEnter (預設 false)
        }
        ```
    *   在 `Query.ts` 中新增主要 API 方法:
        ```typescript
        public observe(observer: EntityObserver, options?: ObserveOptions): QuerySubscription;
        ```
    *   現有的 `onEntityAdded` / `onEntityRemoved` 可重構為內部使用 `observe`，並返回一個取消訂閱函式，以保持部分向後相容性或提供簡化用法：
        ```typescript
        public onEntityAdded(fn: (entity: Entity) => void): () => void;
        public onEntityRemoved(fn: (entity: Entity) => void): () => void;
        ```
*   **實作機制概要**:
    *   `Query` 類別維護一個 `_activeObservers: ActiveObserverRecord[]` 列表，其中 `ActiveObserverRecord` 包含 `observer` 和對應的 `QuerySubscriptionInternal` (內部可修改的訂閱狀態)。
    *   `observe()` 方法:
        1.  建立一個 `QuerySubscriptionInternal` 物件，其 `unsubscribe` 方法會將對應的 `ActiveObserverRecord` 從 `_activeObservers` 列表中移除 (或標記為 `closed`)。
        2.  將 `observer` 和 `subscription` 包裝成 `ActiveObserverRecord` 並存入 `_activeObservers`。
        3.  若 `options.emitCurrent` 為 true，則遍歷 `this._cache` (或 `this.get()`)，對每個實體呼叫 `observer.onEnter()` (需處理錯誤)。
        4.  返回該 `subscription` 物件。
    *   修改 `Query.candidate()`:
        *   移除對舊的 `_onAddListeners` 和 `_onRemoveListeners` 的遍歷。
        *   改為呼叫新的私有輔助方法，如 `_notifyObservers(entity, 'onEnter')` 或 `_notifyObservers(entity, 'onExit')`.
    *   新的 `_notifyObservers(entity, eventType)` 方法:
        *   遍歷 `_activeObservers` (建議遍歷副本以安全處理在回呼中取消訂閱的情況)。
        *   對於未關閉 (`!subscription.closed`) 的訂閱，呼叫其 `observer` 上對應的 `onEnter` 或 `onExit` 回呼 (若存在)。
        *   在呼叫回呼時使用 `try...catch` 包裹，以隔離錯誤。
*   **建議**:
    *   優先實作帶有取消訂閱功能的 `observe` API (如 Option 2 設計)。這是最核心的改進。
    *   `emitCurrent` 選項能顯著提升易用性。
    *   錯誤處理對於回呼的健壯性很重要。

此設計旨在提供一個更完整、更符合現代反應式程式設計習慣的查詢觀察機制，同時解決現有基礎回呼的不足。
