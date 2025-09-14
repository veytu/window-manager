# LaserPointer 模块

这个文件夹包含了所有与激光笔功能相关的代码，用于管理白板中的激光笔功能。

## 文件结构

```
LaserPointer/
├── index.ts                    # 模块导出文件
├── LaserPointerManager.ts      # 单个激光笔管理器
├── LaserPointerMultiManager.ts # 多实例激光笔管理器
├── LaserPointerMultiManager.md # 多实例管理器使用说明
└── README.md                   # 本文件
```

## 主要组件

### LaserPointerManager.ts
- 单个激光笔管理器类
- 处理激光笔的显示、移动和交互
- 管理鼠标事件监听和位置计算
- 处理老师端和学生端的不同逻辑

### LaserPointerMultiManager.ts
- 多实例激光笔管理器类
- 管理多个 LaserPointerManager 实例
- 自动处理不同视图（主视图、应用视图）的激光笔功能
- 监听视图生命周期事件，自动创建和销毁管理器实例
- 主白板使用主视图容器，应用使用 boxview 容器
- 统一管理全局唯一的 `teacher-laser-pointer` 图标元素

### index.ts
- 模块的统一导出文件
- 导出所有激光笔相关的类和接口
- 提供清晰的模块接口

## 使用方式

### 在 WindowManager 中使用

```typescript
import { LaserPointerManager, LaserPointerMultiManager } from "./LaserPointer";

// 单实例管理器（向后兼容）
private _laserPointerManager?: LaserPointerManager;

// 多实例管理器
private _laserPointerMultiManager?: LaserPointerMultiManager;
```

### 独立使用多实例管理器

```typescript
import { LaserPointerMultiManager } from "./LaserPointer";

const multiManager = new LaserPointerMultiManager(windowManager);
multiManager.setupEventListeners();
```

## 视图ID 命名规则

- 主视图: `"main"` - 使用主白板容器
- 应用视图: `"app_{appId}"` (例如: `"app_123"`) - 使用应用的 boxview 容器

## 容器选择逻辑

- **主白板**: 使用 `mainView.divElement.children[0]` 或 fallback 到 `WindowManager.container`
- **应用视图**: 使用 `appProxy.box.element` 作为 boxview 容器

## 设计原则

1. **模块化**: 所有激光笔相关功能都集中在这个文件夹中
2. **向后兼容**: 保持对原有单实例管理器的支持
3. **职责分离**: 单实例和多实例管理器职责明确
4. **易于维护**: 清晰的代码结构和文档
5. **最小侵入**: 对原有 WindowManager 代码影响最小
6. **全局唯一**: 确保 `teacher-laser-pointer` 图标元素全局唯一，避免重复创建

## 扩展性

如果需要添加新的激光笔功能，可以在这个文件夹中添加新的类或模块，并通过 index.ts 导出，保持模块的完整性。
