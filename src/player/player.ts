import { Role, RoleInterface } from "../role/role";

export class Player {
  id: number;
  name: string;
  originalRole: Role = null;
  role: Role;

  constructor(options) {
    this.id = options.id;
    this.name = options.name;
  }

  setRole(role: Role) {
    if (!this.originalRole) {
      this.originalRole = role;
    }

    this.role = role;
  }

  getRole(): any {
    return this.role;
  }

  getOriginalRole(): any {
    return this.originalRole;
  }
  
  swapRole(target: Player) {
	  let targetRole: Role = target.getRole();
	  
	  target.setRole(this.getRole());
	  this.setRole(targetRole);
  }
}
