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
        static int globalCounter = 0;
        static Dictionary<string, Client> AppClients = new Dictionary<string, Client>();
        static IHubCallerConnectionContext cl;

        public Client CurrentClient { get { return AppClients[Context.ConnectionId]; } }

        static Timer mainTimer;

        static flyHub() 
        {
            mainTimer = new Timer();
            mainTimer.Elapsed += new ElapsedEventHandler(MainTick);
            mainTimer.Interval = 1000;
            mainTimer.Start();
        }

        static void MainTick(object sender, ElapsedEventArgs e)
        {
            cl.All.Tick("Hello");
        }

        public void Register()
        {

        }

        public void Resize(long w, long h)
        {
            

            CurrentClient.ViewportW = w;
            CurrentClient.ViewportH = h;
        }

        public void Respawn()
        {
            cl = Clients;

            var client = new Client(Context.ConnectionId);
            client.Name = "Client " + (globalCounter++);
            AppClients.Add(Context.ConnectionId, client);

            CurrentClient.Respawn();
        }
    }
}