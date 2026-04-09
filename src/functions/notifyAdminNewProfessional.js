/* global Deno */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// deno-lint-ignore no-undef
// deno-lint-ignore no-undef
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    
    const { event, data } = body;
    
    // Determine professional type and details based on event
    let professionalName, professionalType, professionalEmail, eventType;
    
    if (data?.walker_name) {
      professionalName = data.walker_name;
      professionalType = 'Walker';
      professionalEmail = data.created_by;
      eventType = event?.type || 'create';
    } else if (data?.trainer_name) {
      professionalName = data.trainer_name;
      professionalType = 'Trainer';
      professionalEmail = data.created_by;
      eventType = event?.type || 'create';
    } else {
      return Response.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Get all admins
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    if (!admins || admins.length === 0) {
      return Response.json({ 
        success: true, 
        admins_notified: 0,
        message: 'No admins found to notify'
      });
    }

    // Determine notification message based on event type
    const messageMap = {
      create: `${professionalName} (${professionalType}) submitted a new profile for approval.`,
      update: `${professionalName} (${professionalType}) updated their profile.`
    };

    const message = messageMap[eventType] || `${professionalName} (${professionalType}) profile activity detected.`;

    // Send notifications to all admins
    const notificationPromises = admins.map(admin =>
      base44.entities.Notification.create({
        recipient_email: admin.email,
        title: `🆕 New ${professionalType} Profile Pending Review`,
        message: message,
        type: 'system',
        icon: '🐾',
        link: '/AdminProfessionalApprovals',
        related_id: professionalEmail,
      }).catch(err => {
        console.warn(`Error notifying admin ${admin.email}:`, err);
        return null;
      })
    );

    await Promise.all(notificationPromises);

    return Response.json({
      success: true,
      admins_notified: admins.length,
      professional_name: professionalName,
      professional_type: professionalType,
      event_type: eventType
    });
  } catch (error) {
    console.error('Error notifying admins:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
});