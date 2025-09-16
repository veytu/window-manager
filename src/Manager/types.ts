/**
 * 悟空用户角色类型
 */
export enum WukongUserRoleType {
  /** 老师 */
  teacher = 0,
  /** 助教 */
  assistant = 1,
  /** 巡课 */
  inspector = 2,
  /** 学生 */
  student = 3,
  /** 工单管理员 */
  admin = 4,
  /** 旁听生 */
  auditor = 5,
  /** 磨课机器人 */
  course_root = 6,
  /** 视频录制机器人 */
  recording_robot = 7,
}

/**
 * 悟空角色别名类型
 */
export type Role = WukongUserRoleType;