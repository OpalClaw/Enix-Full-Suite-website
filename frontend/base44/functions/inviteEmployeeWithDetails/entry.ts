import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'owner')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role, name, title, phone, company, territory } = await req.json();

    if (!email || !role || !name) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Convert 'owner' role to 'admin' for invite, then update if needed
    const inviteRole = role === 'owner' ? 'admin' : role;
    await base44.users.inviteUser(email, inviteRole);

    // If role is 'owner', update the user's role after creation
    if (role === 'owner') {
      const users = await base44.asServiceRole.entities.User.filter({ email });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, { role: 'owner' });
      }
    }

    // Send login instructions email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: email,
      subject: 'Your Enix Exteriors Account - Login Instructions',
      body: `Hello ${name},\n\nYour account has been created with the following details:\n\nRole: ${role}\nTitle: ${title || 'N/A'}\n\nYou can now log in to the system using your email address.\n\nBest regards,\nEnix Exteriors Team`
    });

    return Response.json({
      success: true,
      message: 'Employee invited and login instructions sent'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});