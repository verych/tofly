using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace tofly.classes.app
{
    public class Fly
    {
        public Dictionary<string, Client> Clients = new Dictionary<string, Client>();

        public object GetTickData()
        {
            var data = new TickData();
            data.Clients = Clients.Values.ToArray();
            data.Stars = null;
            return data;
        }
    }
}