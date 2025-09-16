import { WukongUserRoleType } from "./types";

/**
 * 悟空角色管理器：
 * - 维护当前角色与是否为演讲者标记
 * - 动态判断是否具备操作权限（可配置“默认有权限的角色”）
 */
export class WukongRoleManager {
    private wukongCurrentRole: WukongUserRoleType;
    private wukongPresenter: boolean;
    /** 默认具备操作权限的角色集合（不含演讲者，演讲者单独由 wukongPresenter 控制） */
    private wukongOperableRoles: Set<WukongUserRoleType>;

    constructor() {
        this.wukongCurrentRole = WukongUserRoleType.student;
        this.wukongPresenter = false;
        this.wukongOperableRoles = new Set();
    }

    /** 获取当前角色 */
    public getRole(): WukongUserRoleType {
        return this.wukongCurrentRole;
    }

    /** 设置当前角色 */
    public setRole(nextRole: WukongUserRoleType): void {
        this.wukongCurrentRole = nextRole;
    }

    /**
     * 是否具备操作权限（悟空）
     * 规则：演讲者 或 属于“默认有权限角色集合” => true，其余 => false
     */
    public wukongCanOperate(): boolean {
        if (this.wukongPresenter) return true;
        return this.wukongOperableRoles.has(this.wukongCurrentRole);
    }

    /**
     * 是否为演讲者权限
     */
    /** 是否为演讲者（悟空） */
    public wukongIsPresenter(): boolean {
        return this.wukongPresenter;
    }

    /** 设置是否为演讲者（悟空） */
    public wukongSetPresenter(isPresenter: boolean): void {
        this.wukongPresenter = isPresenter;
    }

    /**
     * 设置“默认有操作权限”的角色集合（完全覆盖）
     * 例如：传入 [teacher, assistant, admin]
     */
    public wukongSetOperableRoles(roles: WukongUserRoleType[]): void {
        this.wukongOperableRoles = new Set(roles);
    }

    /** 获取“默认有操作权限”的角色集合（快照） */
    public wukongGetOperableRoles(): WukongUserRoleType[] {
        return Array.from(this.wukongOperableRoles);
    }
}


