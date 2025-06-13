import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
   import { ProfileDetails } from "@/components/profile/ProfileDetails";
   import { useIsMobile } from "@/hooks/use-mobile";

   export default function Profile() {
     const isMobile = useIsMobile();

     return (
       <div className="min-h-screen bg-gray-50">
         <DashboardSidebar isMobile={isMobile} />
         <div className={`${!isMobile ? "lg:pl-64" : ""} p-6 md:p-8`}>
           <div className="max-w-5xl mx-auto">
             <ProfileDetails />
           </div>
         </div>
       </div>
     );
   }