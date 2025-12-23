-- Allow team admins and owners to delete team rooms

create policy "Team admins can delete team rooms"
  on public.rooms for delete
  using (
    team_id is not null
    and exists (
      select 1 from public.team_members
      where team_members.team_id = rooms.team_id
        and team_members.user_id = auth.uid()
        and team_members.role in ('owner', 'admin')
    )
  );
