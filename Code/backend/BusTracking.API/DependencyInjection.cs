using Carevance.Application;
using Carevance.Infrastructure;

namespace Carevance.API
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApiDI(this IServiceCollection services)
        {

            services.AddApplicationDI()
                .AddInfrastructureDI();


            return services;
        }
    }
}
