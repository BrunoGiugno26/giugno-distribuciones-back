export default{
  routes:[
    {
      method:"POST",
      path:"/sync-clerk-user",
      handler:"sync-user.sync",

      config:{
        auth:false,
      },
    },
  ],
};
