from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database.session import get_db
from database.models import Team, UserAccount
from database.schema import TeamCreate, TeamRead, UserAccountRead

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/", response_model=List[TeamRead])
def get_teams(
    skip: int = 0,
    limit: int = 100,
    org_id: int = None,
    db: Session = Depends(get_db)
):
    """Get all teams with optional filtering by org_id"""
    query = db.query(Team)
    if org_id:
        query = query.filter(Team.org_id == org_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{team_id}", response_model=TeamRead)
def get_team(team_id: int, db: Session = Depends(get_db)):
    """Get a specific team by ID"""
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.get("/invite-code/{invite_code}", response_model=TeamRead)
def get_team_by_invite_code(invite_code: str, db: Session = Depends(get_db)):
    """Get a team by invite code"""
    team = db.query(Team).filter(Team.invite_code == invite_code).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")
    return team


@router.post("/", response_model=TeamRead)
def create_team(team_data: TeamCreate, db: Session = Depends(get_db)):
    """Create a new team"""
    # Check if invite code already exists if provided
    if team_data.invite_code:
        existing_team = db.query(Team).filter(Team.invite_code == team_data.invite_code).first()
        if existing_team:
            raise HTTPException(status_code=400, detail="Invite code already exists")

    new_team = Team(**team_data.dict())
    db.add(new_team)
    db.commit()
    db.refresh(new_team)
    return new_team


@router.put("/{team_id}", response_model=TeamRead)
def update_team(team_id: int, team_data: TeamCreate, db: Session = Depends(get_db)):
    """Update an existing team"""
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    for key, value in team_data.dict().items():
        setattr(team, key, value)

    db.commit()
    db.refresh(team)
    return team


@router.delete("/{team_id}")
def delete_team(team_id: int, db: Session = Depends(get_db)):
    """Delete a team"""
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    db.delete(team)
    db.commit()
    return {"message": "Team deleted successfully"}


# =========================================================
# TEAM MEMBERS MANAGEMENT
# =========================================================

@router.get("/{team_id}/members", response_model=List[UserAccountRead])
def get_team_members(team_id: int, db: Session = Depends(get_db)):
    """Get all members of a specific team"""
    # Verify team exists
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Get all users in the team
    members = db.query(UserAccount).filter(UserAccount.team_id == team_id).all()
    return members


@router.post("/{team_id}/members")
def add_team_member(team_id: int, user_id: int, db: Session = Depends(get_db)):
    """Add a user to a team"""
    # Verify team exists
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Get the user
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user belongs to the same organization
    if user.org_id != team.org_id:
        raise HTTPException(status_code=400, detail="User does not belong to the same organization")

    # Check if user is already in another team
    if user.team_id and user.team_id != team_id:
        raise HTTPException(status_code=400, detail="User is already in another team")

    # Add user to team
    user.team_id = team_id
    db.commit()
    db.refresh(user)

    return {
        "message": "User added to team successfully",
        "user_id": user_id,
        "team_id": team_id
    }


@router.delete("/{team_id}/members/{user_id}")
def remove_team_member(team_id: int, user_id: int, db: Session = Depends(get_db)):
    """Remove a user from a team"""
    # Verify team exists
    team = db.query(Team).filter(Team.team_id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Get the user
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user is actually in this team
    if user.team_id != team_id:
        raise HTTPException(status_code=400, detail="User is not a member of this team")

    # Remove user from team
    user.team_id = None
    db.commit()

    return {
        "message": "User removed from team successfully",
        "user_id": user_id,
        "team_id": team_id
    }
