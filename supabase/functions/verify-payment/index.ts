import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import * as crypto from "https://deno.land/std@0.168.0/node/crypto.ts";

const RAZORPAY_WEBHOOK_SECRET = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');

serve(async (req) => {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    const expectedSignature = crypto.createHmac('sha256', RAZORPAY_WEBHOOK_SECRET!).update(bodyText).digest('hex');
    if (expectedSignature !== signature) throw new Error('Invalid webhook signature');

    const body = JSON.parse(bodyText);
    if (body.event !== 'payment.captured') return new Response(JSON.stringify({ status: 'ignored' }), { status: 200 });
    
    const { cart, profile } = JSON.parse(body.payload.payment.entity.notes.custom_data);
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const { data: newOrder, error: orderErr } = await supabaseAdmin.from('orders').insert([{ user_id: profile.sub, user_email: profile.email }]).select().single();
    if (orderErr) throw orderErr;

    const orderItems = Object.values(cart).map((ci) => ({
      order_id: newOrder.id,
      item_id: (ci as any).item.id,
      qty: (ci as any).qty,
      price: (ci as any).item.price
    }));

    const { error: itemsErr } = await supabaseAdmin.from('order_items').insert(orderItems);
    if (itemsErr) throw itemsErr;

    return new Response(JSON.stringify({ status: 'ok' }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
});
