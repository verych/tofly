using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNet.SignalR;
using tofly.classes.app;
using System.Timers;
using Microsoft.AspNet.SignalR.Hubs;

namespace tofly
{
    public class flyHub : Hub
    {
        static Fly App = new Fly();
        static IHubCallerConnectionContext Sockets;
        static Timer mainTimer;

        public Client CurrentClient { get { return App.Clients[Context.ConnectionId]; } }

        static void MainTick(object sender, ElapsedEventArgs e)
        {
            Sockets.All.Tick(App.GetTickData());
        }

        public void Register()
        {
            if (Sockets == null)
            {
                Sockets = Clients;
                mainTimer = new Timer();
                mainTimer.Elapsed += new ElapsedEventHandler(MainTick);
                mainTimer.Interval = 30;
                mainTimer.Start();
            }

            var client = new Client(Context.ConnectionId);
            client.Name = "Client " + App.Clients.Count;
            App.Clients.Add(Context.ConnectionId, client);
        }

        public void Resize(long w, long h)
        {
            CurrentClient.ViewportW = w;
            CurrentClient.ViewportH = h;
        }

        public void Respawn()
        {
            CurrentClient.Respawn();
        }
    }
}