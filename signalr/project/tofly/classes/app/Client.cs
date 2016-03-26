using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace tofly.classes.app
{
    public class Client
    {
        public string ConnectionId;
        public string Name;
        public bool Active = false;

        public long ViewportW;
        public long ViewportH;

        public Client(string connectionId)
        {
            ConnectionId = connectionId;
        }

        public void Respawn()
        {
            Active = true;
        }
    }
}